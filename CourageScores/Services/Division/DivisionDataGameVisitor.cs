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
        if (players.Count != 1)
        {
            // only record details of singles matches
            return;
        }

        var player = players.Single();
        if (_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            score.Win++;
        }
        else
        {
            _divisionData.Players.Add(player.Id, new DivisionData.Score { Win = 1, Player = player });
        }
    }

    public void VisitMatchDraw(IReadOnlyCollection<GamePlayer> homePlayers, IReadOnlyCollection<GamePlayer> awayPlayers, int score)
    {
        if (homePlayers.Count != 1 || awayPlayers.Count != 1)
        {
            // only record details of singles matches
            return;
        }

        AddDraw(homePlayers.Single(), _divisionData.Players, homePlayers.Single(), null);
        AddDraw(awayPlayers.Single(), _divisionData.Players, awayPlayers.Single(), null);
    }

    public void VisitMatchLost(IReadOnlyCollection<GamePlayer> players, TeamDesignation team)
    {
        if (players.Count != 1)
        {
            // only record details of singles matches
            return;
        }

        var player = players.Single();
        if (_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            score.Lost++;
        }
        else
        {
            _divisionData.Players.Add(player.Id, new DivisionData.Score { Lost = 1, Player = player });
        }
    }

    public void VisitOneEighty(IGamePlayer player)
    {
        if (_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            score.OneEighty++;
        }
        else
        {
            _divisionData.Players.Add(player.Id, new DivisionData.Score { OneEighty = 1, Player = player });
        }
    }

    public void VisitHiCheckout(NotablePlayer player)
    {
        if (!int.TryParse(player.Notes, out var hiCheck))
        {
            return;
        }

        if (_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            if (hiCheck > score.HiCheckout)
            {
                score.HiCheckout = hiCheck;
            }
            score.HiCheckout++;
        }
        else
        {
            _divisionData.Players.Add(player.Id, new DivisionData.Score { HiCheckout = hiCheck, Player = player });
        }
    }

    public void VisitTeam(GameTeam team, GameState gameState)
    {
        if (gameState != GameState.Played)
        {
            return;
        }

        if (_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score.TeamPlayed++;
        }
        else
        {
            _divisionData.Teams.Add(team.Id, new DivisionData.Score { TeamPlayed = 1, Team = team });
        }
    }

    public void VisitPlayer(GamePlayer player, int matchPlayerCount)
    {
        if (matchPlayerCount != 1)
        {
            // only record results of singles matches
            return;
        }

        if (_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            if (score.PlayerPlayCount.TryGetValue(matchPlayerCount, out var playedCount))
            {
                score.PlayerPlayCount[matchPlayerCount] = playedCount + 1;
            }
            else
            {
                score.PlayerPlayCount[matchPlayerCount] = 1;
            }
        }
        else
        {
            _divisionData.Players.Add(player.Id, new DivisionData.Score
            {
                Player = player,
                PlayerPlayCount =
                {
                    { matchPlayerCount, 1 },
                }
            });
        }
    }

    public void VisitGameDraw(GameTeam home, GameTeam away)
    {
        AddDraw(home, _divisionData.Teams, null, home);
        AddDraw(away, _divisionData.Teams, null, away);
    }

    public void VisitGameWinner(GameTeam team)
    {
        if (_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score.Win++;
        }
        else
        {
            _divisionData.Teams.Add(team.Id, new DivisionData.Score { Win = 1, Team = team });
        }
    }

    public void VisitGameLost(GameTeam team)
    {
        if (_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score.Lost++;
        }
        else
        {
            _divisionData.Teams.Add(team.Id, new DivisionData.Score { Lost = 1, Team = team });
        }
    }

    private static void AddDraw(CosmosEntity entity, IDictionary<Guid, DivisionData.Score> accumulator, GamePlayer? player, GameTeam? team)
    {
        if (accumulator.TryGetValue(entity.Id, out var score))
        {
            score.Draw++;
        }
        else
        {
            accumulator.Add(entity.Id, new DivisionData.Score { Draw = 1, Player = player, Team = team });
        }
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