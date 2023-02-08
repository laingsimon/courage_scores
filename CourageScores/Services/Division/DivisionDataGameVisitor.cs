using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Division;

public class DivisionDataGameVisitor : IGameVisitor
{
    private readonly DivisionData _divisionData;
    private readonly Dictionary<Guid, TeamDto> _teamLookup;

    public DivisionDataGameVisitor(DivisionData divisionData, Dictionary<Guid, TeamDto> teamLookup)
    {
        _divisionData = divisionData;
        _teamLookup = teamLookup;
    }

    public void VisitGame(Models.Cosmos.Game.Game game)
    {
        var playerGamesVisitor = new PlayerAndGameLookupVisitor(game, _divisionData);
        var playerTeamVisitor = new PlayerTeamLookupVisitor(game.Home, game.Away, _divisionData, _teamLookup, game.SeasonId);
        game.Accept(playerGamesVisitor);
        game.Accept(playerTeamVisitor);
    }

    public void VisitMatchWin(IReadOnlyCollection<GamePlayer> players, TeamDesignation team)
    {
        foreach (var player in players)
        {
            if (!_divisionData.Players.TryGetValue(player.Id, out var score))
            {
                score = new DivisionData.PlayerScore();
                _divisionData.Players.Add(player.Id, score);
            }

            score.GetScores(players.Count).Win++;
        }
    }

    public void VisitMatchDraw(IReadOnlyCollection<GamePlayer> homePlayers, IReadOnlyCollection<GamePlayer> awayPlayers, int score)
    {
        if (homePlayers.Count != 1 || awayPlayers.Count != 1)
        {
            // only record details of singles matches
            return;
        }

        AddDraw(homePlayers.Single(), _divisionData.Players, () => new DivisionData.PlayerScore
        {
            Player = homePlayers.Single(),
        });
        AddDraw(awayPlayers.Single(), _divisionData.Players, () => new DivisionData.PlayerScore
        {
            Player = awayPlayers.Single(),
        });
    }

    public void VisitMatchLost(IReadOnlyCollection<GamePlayer> players, TeamDesignation team)
    {
        foreach (var player in players)
        {
            if (!_divisionData.Players.TryGetValue(player.Id, out var score))
            {
                score = new DivisionData.PlayerScore();
                _divisionData.Players.Add(player.Id, score);
            }

            score.GetScores(players.Count).Lost++;
        }
    }

    public void VisitOneEighty(IGamePlayer player)
    {
        if (!_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            score = new DivisionData.PlayerScore { Player = player };
            _divisionData.Players.Add(player.Id, score);
        }

        score.OneEighty++;
    }

    public void VisitHiCheckout(INotablePlayer player)
    {
        if (!int.TryParse(player.Notes, out var hiCheck))
        {
            return;
        }

        if (!_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            score = new DivisionData.PlayerScore { Player = player };
            _divisionData.Players.Add(player.Id, score);
        }

        if (hiCheck > score.HiCheckout)
        {
            score.HiCheckout = hiCheck;
        }
    }

    public void VisitTeam(GameTeam team, GameState gameState)
    {
        if (gameState != GameState.Played)
        {
            return;
        }

        if (!_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score = new DivisionData.TeamScore();
            _divisionData.Teams.Add(team.Id, score);
        }

        score.Played++;
    }

    public void VisitPlayer(GamePlayer player, int matchPlayerCount)
    {
        if (!_divisionData.Players.TryGetValue(player.Id, out var playerScore))
        {
            playerScore = new DivisionData.PlayerScore
            {
                Player = player,
            };
            _divisionData.Players.Add(player.Id, playerScore);
        }

        var score = playerScore.GetScores(matchPlayerCount);
        score.Played++;
    }

    public void VisitGameDraw(GameTeam home, GameTeam away)
    {
        AddDraw(home, _divisionData.Teams, () => new DivisionData.TeamScore());
        AddDraw(away, _divisionData.Teams, () => new DivisionData.TeamScore());
    }

    public void VisitGameWinner(GameTeam team)
    {
        if (!_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score = new DivisionData.TeamScore();
            _divisionData.Teams.Add(team.Id, score);
        }

        score.Win++;
    }

    public void VisitGameLost(GameTeam team)
    {
        if (!_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score = new DivisionData.TeamScore();
            _divisionData.Teams.Add(team.Id, score);
        }

        score.Lost++;
    }

    private static void AddDraw<T>(CosmosEntity entity, IDictionary<Guid, T> accumulator, Func<T> createScore)
        where T : DivisionData.IScore, new()
    {
        if (!accumulator.TryGetValue(entity.Id, out var score))
        {
            score = createScore();
            accumulator.Add(entity.Id, score);
        }

        score.Draw++;
    }

    private class PlayerAndGameLookupVisitor : IGameVisitor
    {
        private readonly Models.Cosmos.Game.Game _game;
        private readonly DivisionData _divisionData;

        public PlayerAndGameLookupVisitor(Models.Cosmos.Game.Game game, DivisionData divisionData)
        {
            _game = game;
            _divisionData = divisionData;
        }

        public void VisitPlayer(GamePlayer player, int matchPlayerCount)
        {
            if (!_divisionData.PlayersToFixtures.TryGetValue(player.Id, out var gameLookup))
            {
                gameLookup = new Dictionary<DateTime, Guid>();
                _divisionData.PlayersToFixtures.Add(player.Id, gameLookup);
            }

            gameLookup.TryAdd(_game.Date, _game.Id);
        }
    }

    private class PlayerTeamLookupVisitor : IGameVisitor
    {
        private readonly TeamDto _home;
        private readonly TeamDto _away;
        private readonly DivisionData _divisionData;
        private readonly Guid _seasonId;

        public PlayerTeamLookupVisitor(GameTeam home, GameTeam away, DivisionData divisionData,
            Dictionary<Guid, TeamDto> teamLookup, Guid seasonId)
        {
            _home = teamLookup[home.Id];
            _away = teamLookup[away.Id];
            _divisionData = divisionData;
            _seasonId = seasonId;
        }

        public void VisitMatch(GameMatch match)
        {
            ProcessPlayers(match.HomePlayers, _home);
            ProcessPlayers(match.AwayPlayers, _away);
        }

        private void ProcessPlayers(IEnumerable<GamePlayer> players, TeamDto team)
        {
            foreach (var player in players)
            {
                var teamSeason = team.Seasons?.Single(s => s.SeasonId == _seasonId);
                var teamPlayer = teamSeason?.Players.SingleOrDefault(p => p.Id == player.Id);

                _divisionData.PlayerIdToTeamLookup.TryAdd(
                    player.Id,
                    new DivisionData.TeamPlayerTuple(
                        teamPlayer ?? new TeamPlayerDto
                        {
                            Name = player.Name,
                            Id = player.Id,
                        },
                        team));
            }
        }
    }
}