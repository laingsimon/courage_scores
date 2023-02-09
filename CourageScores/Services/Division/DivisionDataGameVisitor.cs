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
        if (game.Postponed)
        {
            return;
        }

        var playerGamesVisitor = new PlayerAndGameLookupVisitor(game, _divisionData);
        var playerTeamVisitor = new PlayerTeamLookupVisitor(game.Home, game.Away, _divisionData, _teamLookup, game.SeasonId);
        game.Accept(playerGamesVisitor);
        game.Accept(playerTeamVisitor);
    }

    public void VisitMatchWin(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
        var winRateRecorded = false;
        foreach (var player in players)
        {
            if (!_divisionData.Players.TryGetValue(player.Id, out var playerScore))
            {
                playerScore = new DivisionData.PlayerScore();
                _divisionData.Players.Add(player.Id, playerScore);
            }

            var scoreForLegSize = playerScore.GetScores(players.Count);
            scoreForLegSize.MatchesWon++;
            if (!winRateRecorded)
            {
                scoreForLegSize.TeamWinRate += winningScore;
                scoreForLegSize.TeamLossRate += losingScore;
            }

            scoreForLegSize.PlayerWinRate += winningScore;
            scoreForLegSize.PlayerLossRate += losingScore;
            winRateRecorded = true;
        }
    }

    public void VisitMatchLost(IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore, int winningScore)
    {
        var winRateRecorded = false;
        foreach (var player in players)
        {
            if (!_divisionData.Players.TryGetValue(player.Id, out var playerScore))
            {
                playerScore = new DivisionData.PlayerScore();
                _divisionData.Players.Add(player.Id, playerScore);
            }

            var scoreForLegSize = playerScore.GetScores(players.Count);
            scoreForLegSize.MatchesLost++;
            if (!winRateRecorded)
            {
                scoreForLegSize.TeamLossRate += winningScore;
                scoreForLegSize.TeamWinRate += losingScore;
            }

            scoreForLegSize.PlayerLossRate += winningScore;
            scoreForLegSize.PlayerWinRate += losingScore;
            winRateRecorded = true;
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

        score.FixturesPlayed++;
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
        score.MatchesPlayed++;
    }

    public void VisitGameDraw(GameTeam home, GameTeam away)
    {
        if (!_divisionData.Teams.TryGetValue(home.Id, out var homeScore))
        {
            homeScore = new DivisionData.TeamScore();
            _divisionData.Teams.Add(home.Id, homeScore);
        }

        homeScore.FixturesDrawn++;

        if (!_divisionData.Teams.TryGetValue(away.Id, out var awayScore))
        {
            awayScore = new DivisionData.TeamScore();
            _divisionData.Teams.Add(away.Id, awayScore);
        }

        awayScore.FixturesDrawn++;
    }

    public void VisitGameWinner(GameTeam team)
    {
        if (!_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score = new DivisionData.TeamScore();
            _divisionData.Teams.Add(team.Id, score);
        }

        score.FixturesWon++;
    }

    public void VisitGameLost(GameTeam team)
    {
        if (!_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score = new DivisionData.TeamScore();
            _divisionData.Teams.Add(team.Id, score);
        }

        score.FixturesLost++;
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
#pragma warning disable CS8601
            if (!teamLookup.TryGetValue(home.Id, out _home))
#pragma warning restore CS8601
            {
                _home = teamLookup.Values.SingleOrDefault(t => t.Name == home.Name)
                        ?? throw new InvalidOperationException($"Could not find team data for {home.Name} - {home.Id}");
            }

#pragma warning disable CS8601
            if (!teamLookup.TryGetValue(away.Id, out _away))
#pragma warning restore CS8601
            {
                _away = teamLookup.Values.SingleOrDefault(t => t.Name == away.Name)
                        ?? throw new InvalidOperationException($"Could not find team data for {away.Name} - {away.Id}");
            }

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