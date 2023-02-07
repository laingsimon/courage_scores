using CourageScores.Models.Cosmos.Game;
using CourageScores.Services.Command;
using DataImport.Models;

namespace DataImport.Importers;

public class ScoresImporter : IImporter
{
    private readonly TextWriter _log;
    private readonly IImportRequest _request;
    private readonly INameComparer _nameComparer;

    public ScoresImporter(TextWriter log, IImportRequest request, INameComparer nameComparer)
    {
        _log = log;
        _request = request;
        _nameComparer = nameComparer;
    }

    public async Task<bool> RunImport(AccessDatabase source, CosmosDatabase destination, ImportContext context, CancellationToken token)
    {
        var scores = await source.GetTable<LegHistory>(TableNames.Scores, token);
        var scoresGroupedByFixture = scores.GroupBy(s => s.fixtureno).ToArray();
        var fixtureCount = 0;

        var totalSuccess = true;
        foreach (var accessFixture in scoresGroupedByFixture.OrderBy(g => g.First().fixdate))
        {
            if (token.IsCancellationRequested)
            {
                return totalSuccess;
            }

            fixtureCount++;
            totalSuccess = await ImportFixture(accessFixture.ToArray(), context, fixtureCount, token) && totalSuccess;
        }

        foreach (var change in context.Fixtures!.GetModified())
        {
            if (token.IsCancellationRequested)
            {
                return totalSuccess;
            }

            await _log.WriteLineAsync($"Uploading change: {change.Key}: {change.Value.Id}");
            var result = await destination.UpsertAsync(change.Value, "game", token);
            if (!result.Success)
            {
                totalSuccess = false;
                await _log.WriteLineAsync($"Failed to upload change: {result.Success}");
            }
        }

        return totalSuccess;
    }

    private async Task<bool> ImportFixture(IReadOnlyCollection<LegHistory> fixtureLegs, ImportContext context, int fixtureNo, CancellationToken token)
    {
        var teams = fixtureLegs.Select(l => l.opponents).Distinct().ToArray();
        if (teams.Length != 2)
        {
            await _log.WriteLineAsync($"Fixture {fixtureLegs.First().fixtureno} has incorrect number of opponents, should be 2 was: {string.Join(", ", teams)}");
            return false;
        }

        var legMap = fixtureLegs.GroupBy(l => l.position).Select(g =>
            new LegMapping
            {
                LegNo = g.Key!.Value,
                FixtureNo = g.Select(l => l.fixtureno).Distinct().Single()!.Value,
                Date = g.Select(l => l.fixdate).Distinct().Single(),
                HomePerspective = g.OrderBy(l => l.legkey).ElementAt(1),
                AwayPerspective = g.OrderBy(l => l.legkey).ElementAt(0),
            }).OrderBy(l => l.LegNo).ToArray();

        if (legMap.Length != 8)
        {
            await _log.WriteLineAsync($"Fixture {fixtureLegs.First().fixtureno} has incorrect number of legs, should be 8 was {legMap.Length}");
            return false;
        }

        var fixtureData = legMap[0];
        if (fixtureData.Date == null)
        {
            await _log.WriteLineAsync($"Fixture {fixtureData.FixtureNo} has no date");
            return false;
        }

        var home = fixtureData.AwayPerspective.opponents!;
        var away = fixtureData.HomePerspective.opponents!;
        await _log.WriteLineAsync($"Loading fixture {fixtureNo}: {home} vs {away} on {fixtureData.Date:dd MMM yyyy}");

        if (!context.Fixtures!.TryGetValue($"{home}-{away}", out var cosmosFixture))
        {
            cosmosFixture = CreateGame(context, fixtureData.Date.Value, home, away);
        }

        if (SetMatches(cosmosFixture, legMap, context, token))
        {
            context.Fixtures.SetModified(cosmosFixture);
        }

        return true;
    }

    private Game CreateGame(ImportContext context, DateTime date, string home, string away)
    {
        var cosmosFixture = _request.Created(new Game
        {
            Id = Guid.NewGuid(),
            DivisionId = _request.DivisionId,
            SeasonId = _request.SeasonId,
            Date = date,
            Home = new GameTeam
            {
                Name = home,
                Id = context.Teams![home].Id,
            },
            Away = new GameTeam
            {
                Name = away,
                Id = context.Teams![away].Id,
            },
        });
        context.Fixtures!.Add($"{home}-{away}", _request.Created(cosmosFixture));
        return cosmosFixture;
    }

    private bool SetMatches(Game game, IEnumerable<LegMapping> legMap, ImportContext context, CancellationToken token)
    {
        var gameModified = false;
        foreach (var leg in legMap)
        {
            if (token.IsCancellationRequested)
            {
                return gameModified;
            }

            var match = game.Matches.ElementAtOrDefault(leg.LegNo - 1);
            var modified = SetMatch(game, leg, match, context);
            gameModified = modified || gameModified;
        }

        return gameModified;
    }

    private bool SetMatch(Game game, LegMapping leg, GameMatch? match, ImportContext context)
    {
        try
        {
            var gameModified = false;

            if (match == null)
            {
                gameModified = true;
                match = _request.Created(new GameMatch
                {
                    Id = Guid.NewGuid(),
                    NumberOfLegs = -1,
                    StartingScore = -1,
                });
                game.Matches.Add(match);
            }

            var homePerspective = leg.HomePerspective;
            var playerEqualityComparer = new PlayerEqualityComparer();
            var listEqualityComparer = new ListEqualityComparer<GamePlayer>(playerEqualityComparer);
            match.HomePlayers = ApplyChange(
                match.HomePlayers,
                Players(homePerspective.homeplayer, homePerspective.hplay2, homePerspective.hplay3).Select(ToPlayer(game.Home.Id, context)).ToList(),
                ref gameModified,
                listEqualityComparer);
            match.AwayPlayers = ApplyChange(
                match.AwayPlayers,
                Players(homePerspective.otherplayer, homePerspective.aplay2, homePerspective.aplay3).Select(ToPlayer(game.Away.Id, context)).ToList(),
                ref gameModified,
                listEqualityComparer);
            match.HomeScore = ApplyChange(match.HomeScore, leg.HomePerspective.legswon, ref gameModified);
            match.AwayScore = ApplyChange(match.AwayScore, leg.HomePerspective.legslost, ref gameModified);
            match.StartingScore = ApplyChange(match.StartingScore, UpdateScoresCommand.GetStartingScore(match.HomePlayers.Count), ref gameModified);
            match.NumberOfLegs = ApplyChange(match.NumberOfLegs, UpdateScoresCommand.GetNumberOfLegs(match.HomePlayers.Count), ref gameModified);

            return gameModified;
        }
        catch (Exception exc)
        {
            _log.WriteLineAsync($"Failed to set match for game {game.Home.Name} vs {game.Away.Name}: {exc.Message}");
            return false;
        }
    }

    private static T ApplyChange<T>(T currentValue, T expectedValue, ref bool modified, IEqualityComparer<T>? equalityComparer = null)
    {
        equalityComparer ??= EqualityComparer<T>.Default;

        if (equalityComparer.Equals(currentValue, expectedValue))
        {
            return currentValue;
        }

        modified = true;
        return expectedValue;
    }

    private Func<string, GamePlayer> ToPlayer(Guid teamId, ImportContext context)
    {
        var team = context.Teams!.SingleOrDefault(pair => pair.Value.Id == teamId).Value;
        if (team == null)
        {
            throw new InvalidOperationException($"Cannot find team with id {teamId}");
        }

        var teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == _request.SeasonId);
        if (teamSeason == null)
        {
            throw new InvalidOperationException($"Cannot find teamSeason for team {teamId} and season {_request.SeasonId}");
        }

        return playerCode =>
        {
            if (!context.PlayerNameLookup.TryGetValue(playerCode, out var teamPlayer))
            {
                teamPlayer = teamSeason.Players.SingleOrDefault(p => _nameComparer.PlayerNameEquals(p.Name, playerCode, team.Name));
                if (teamPlayer == null)
                {
                    throw new InvalidOperationException($"Cannot find player {playerCode} in team {team.Name}");
                }
            }

            return _request.Created(new GamePlayer
            {
                Id = teamPlayer.Id,
                Name = playerCode,
            });
        };
    }

    private static IEnumerable<string> Players(params string?[] playerNames)
    {
        return playerNames.Where(n => !string.IsNullOrEmpty(n)).ToList()!;
    }

    private class LegMapping
    {
        public byte LegNo { get; set; }
        public short FixtureNo { get; set; }
        public DateTime? Date { get; set; }
        public LegHistory HomePerspective { get; set; } = null!;
        public LegHistory AwayPerspective { get; set; } = null!;
    }

    private class ListEqualityComparer<T> : IEqualityComparer<List<T>>
    {
        private readonly IEqualityComparer<T> _itemComparer;

        public ListEqualityComparer(IEqualityComparer<T> itemComparer)
        {
            _itemComparer = itemComparer;
        }

        public bool Equals(List<T>? x, List<T>? y)
        {
            return x?.Count == y?.Count
                   && x?.Select((itemX, index) => _itemComparer.Equals(itemX, y![index])).All(equal => equal) == true;
        }

        public int GetHashCode(List<T> obj)
        {
            return obj.Count;
        }
    }

    private class PlayerEqualityComparer : IEqualityComparer<GamePlayer>
    {
        public bool Equals(GamePlayer? x, GamePlayer? y)
        {
            if (ReferenceEquals(x, y)) return true;
            if (ReferenceEquals(x, null)) return false;
            if (ReferenceEquals(y, null)) return false;
            if (x.GetType() != y.GetType()) return false;
            return x.Name == y.Name;
        }

        public int GetHashCode(GamePlayer obj)
        {
            return obj.Name.GetHashCode();
        }
    }
}