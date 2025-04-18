using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Services.Division;

public class DivisionDataGameVisitor : IGameVisitor
{
    private readonly DivisionData _divisionData;
    private CosmosGame? _lastGame;

    public DivisionDataGameVisitor(DivisionData divisionData)
    {
        _divisionData = divisionData;
    }

    public void VisitDataError(IVisitorScope scope, string dataError)
    {
        var error = new DataErrorDto
        {
            Message = dataError,
        };

        if (_lastGame != null)
        {
            error.GameId = _lastGame.Id;
        }

        _divisionData.DataErrors.Add(error);
    }

    public void VisitGame(CosmosGame game)
    {
        _lastGame = game;
        if (game.Postponed)
        {
            return;
        }

        var playerGamesVisitor = new PlayersToFixturesLookupVisitor(game.Id, game.Date, _divisionData);
        game.Accept(new VisitorScope(), playerGamesVisitor);
    }

    public void VisitGame(TournamentGame tournament)
    {
        _lastGame = null;
        var playerGamesVisitor = new PlayersToFixturesLookupVisitor(tournament.Id, tournament.Date, _divisionData);
        tournament.Accept(new VisitorScope(), playerGamesVisitor);
    }

    public void VisitMatchWin(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int winningScore, int losingScore)
    {
        if (scope.Game?.IsKnockout == true || scope.ObscureScores)
        {
            // don't include knockout wins/losses in players table
            return;
        }

        var winRateRecorded = false;
        foreach (var player in players)
        {
            if (!_divisionData.Players.TryGetValue(player.Id, out var playerScore))
            {
                playerScore = new DivisionData.PlayerScore
                {
                    Player = player,
                    Team = GetTeam(team),
                };
                _divisionData.Players.Add(player.Id, playerScore);
            }

            playerScore.Games.Add(scope.Game);
            var scoreForLegSize = playerScore.GetScores(players.Count);
            scoreForLegSize.MatchesWon++;
            scoreForLegSize.MatchesPlayed++;
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

    public void VisitMatchLost(IVisitorScope scope, IReadOnlyCollection<GamePlayer> players, TeamDesignation team, int losingScore, int winningScore)
    {
        if (scope.Game?.IsKnockout == true || scope.ObscureScores)
        {
            // don't include knockout wins/losses in players table
            return;
        }

        var winRateRecorded = false;
        foreach (var player in players)
        {
            if (!_divisionData.Players.TryGetValue(player.Id, out var playerScore))
            {
                playerScore = new DivisionData.PlayerScore
                {
                    Player = player,
                    Team = GetTeam(team),
                };
                _divisionData.Players.Add(player.Id, playerScore);
            }

            playerScore.Games.Add(scope.Game);
            var scoreForLegSize = playerScore.GetScores(players.Count);
            scoreForLegSize.MatchesLost++;
            scoreForLegSize.MatchesPlayed++;
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

    public void VisitOneEighty(IVisitorScope scope, IGamePlayer player)
    {
        if (scope.ObscureScores)
        {
            return;
        }

        if (!_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            score = new DivisionData.PlayerScore
            {
                Player = player,
                Team = FindTeamForPlayer(player),
            };
            _divisionData.Players.Add(player.Id, score);
        }

        if (scope.Game != null)
        {
            score.Games.Add(scope.Game);
        }
        if (scope.Tournament != null)
        {
            score.Tournaments.Add(scope.Tournament);
        }
        score.FromKnockout = score.FromKnockout || scope.Game?.IsKnockout == true;
        score.OneEighties++;
    }

    public void VisitHiCheckout(IVisitorScope scope, INotablePlayer player)
    {
        if (scope.ObscureScores)
        {
            return;
        }

        if (!int.TryParse(player.Notes, out var hiCheck))
        {
            return;
        }

        if (!_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            score = new DivisionData.PlayerScore
            {
                Player = player,
                Team = FindTeamForPlayer(player),
            };
            _divisionData.Players.Add(player.Id, score);
        }

        score.FromKnockout = score.FromKnockout || scope.Game?.IsKnockout == true;
        if (scope.Game != null)
        {
            score.Games.Add(scope.Game);
        }
        if (scope.Tournament != null)
        {
            score.Tournaments.Add(scope.Tournament);
        }

        if (hiCheck > score.HiCheckout)
        {
            score.HiCheckout = hiCheck;
        }
    }

    public void VisitTeam(IVisitorScope scope, GameTeam team, GameState gameState)
    {
        if (scope.Game?.IsKnockout == true || scope.ObscureScores)
        {
            // don't include knockout plays in teams table
            return;
        }

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

    public void VisitGameDraw(IVisitorScope scope, GameTeam home, GameTeam away)
    {
        if (scope.Game?.IsKnockout == true || scope.ObscureScores)
        {
            // don't include knockout draws in teams table
            return;
        }

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

    public void VisitGameWinner(IVisitorScope scope, GameTeam team)
    {
        if (scope.Game?.IsKnockout == true || scope.ObscureScores)
        {
            // don't include knockout wins in teams table
            return;
        }

        if (!_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score = new DivisionData.TeamScore();
            _divisionData.Teams.Add(team.Id, score);
        }

        score.FixturesWon++;
    }

    public void VisitGameLoser(IVisitorScope scope, GameTeam team)
    {
        if (scope.Game?.IsKnockout == true || scope.ObscureScores)
        {
            // don't include knockout losses in teams table
            return;
        }

        if (!_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score = new DivisionData.TeamScore();
            _divisionData.Teams.Add(team.Id, score);
        }

        score.FixturesLost++;
    }

    private GameTeam? FindTeamForPlayer(IGamePlayer player)
    {
        if (_lastGame == null)
        {
            return null;
        }

        foreach (var match in _lastGame.Matches)
        {
            if (match.HomePlayers.Any(p => p.Id == player.Id))
            {
                return GetTeam(TeamDesignation.Home);
            }

            if (match.AwayPlayers.Any(p => p.Id == player.Id))
            {
                return GetTeam(TeamDesignation.Away);
            }
        }

        return null;
    }

    private GameTeam? GetTeam(TeamDesignation teamDesignation)
    {
        if (_lastGame == null)
        {
            return null;
        }

        switch (teamDesignation)
        {
            case TeamDesignation.Home:
                return _lastGame?.Home;
            case TeamDesignation.Away:
                return _lastGame?.Away;
            default:
                return null;
        }
    }

    private class PlayersToFixturesLookupVisitor : IGameVisitor
    {
        private readonly DateTime _date;
        private readonly DivisionData _divisionData;
        private readonly Guid _id;

        public PlayersToFixturesLookupVisitor(Guid id, DateTime date, DivisionData divisionData)
        {
            _id = id;
            _date = date;
            _divisionData = divisionData;
        }

        public void VisitPlayer(IVisitorScope scope, GamePlayer player, int matchPlayerCount)
        {
            if (scope.ObscureScores)
            {
                return;
            }

            if (!_divisionData.PlayersToFixtures.TryGetValue(player.Id, out var gameLookup))
            {
                gameLookup = new Dictionary<DateTime, Guid>();
                _divisionData.PlayersToFixtures.Add(player.Id, gameLookup);
            }

            gameLookup.TryAdd(_date, _id);
        }
    }
}