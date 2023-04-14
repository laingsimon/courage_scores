using System.Diagnostics;
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

    public void VisitDataError(string dataError)
    {
        _divisionData.DataErrors.Add(dataError);
    }

    public void VisitGame(Models.Cosmos.Game.Game game)
    {
        if (game.Postponed)
        {
            return;
        }

        var playerGamesVisitor = new PlayersToFixturesLookupVisitor(game.Id, game.Date, _divisionData);
        var playerTeamVisitor = new GamePlayerToTeamLookupVisitor(game.Home, game.Away, _divisionData, _teamLookup, game.SeasonId);
        game.Accept(playerGamesVisitor);
        game.Accept(playerTeamVisitor);
    }

    public void VisitGame(TournamentGame game)
    {
        var playerGamesVisitor = new PlayersToFixturesLookupVisitor(game.Id, game.Date, _divisionData);
        game.Accept(playerGamesVisitor);
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

    public void VisitOneEighty(IGamePlayer player)
    {
        if (!_divisionData.Players.TryGetValue(player.Id, out var score))
        {
            score = new DivisionData.PlayerScore { Player = player };
            _divisionData.Players.Add(player.Id, score);
        }

        score.OneEighties++;
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

    public void VisitGameLoser(GameTeam team)
    {
        if (!_divisionData.Teams.TryGetValue(team.Id, out var score))
        {
            score = new DivisionData.TeamScore();
            _divisionData.Teams.Add(team.Id, score);
        }

        score.FixturesLost++;
    }

    private class PlayersToFixturesLookupVisitor : IGameVisitor
    {
        private readonly Guid _id;
        private readonly DateTime _date;
        private readonly DivisionData _divisionData;

        public PlayersToFixturesLookupVisitor(Guid id, DateTime date, DivisionData divisionData)
        {
            _id = id;
            _date = date;
            _divisionData = divisionData;
        }

        public void VisitPlayer(GamePlayer player, int matchPlayerCount)
        {
            if (!_divisionData.PlayersToFixtures.TryGetValue(player.Id, out var gameLookup))
            {
                gameLookup = new Dictionary<DateTime, Guid>();
                _divisionData.PlayersToFixtures.Add(player.Id, gameLookup);
            }

            gameLookup.TryAdd(_date, _id);
        }
    }

    private class GamePlayerToTeamLookupVisitor : IGameVisitor
    {
        private readonly TeamDto _home;
        private readonly TeamDto _away;
        private readonly DivisionData _divisionData;
        private readonly Guid _seasonId;

        public GamePlayerToTeamLookupVisitor(GameTeam home, GameTeam away, DivisionData divisionData,
            Dictionary<Guid, TeamDto> teamLookup, Guid seasonId)
        {
#pragma warning disable CS8601
            if (!teamLookup.TryGetValue(home.Id, out _home))
#pragma warning restore CS8601
            {
                _home = teamLookup.Values.SingleOrDefault(t => t.Name == home.Name)
                        ?? CreateMissingTeamDto(home);
            }

#pragma warning disable CS8601
            if (!teamLookup.TryGetValue(away.Id, out _away))
#pragma warning restore CS8601
            {
                _away = teamLookup.Values.SingleOrDefault(t => t.Name == away.Name)
                        ?? CreateMissingTeamDto(away);
            }

            _divisionData = divisionData;
            _seasonId = seasonId;
        }

        private static TeamDto CreateMissingTeamDto(GameTeam team)
        {
            Trace.TraceWarning($"Could not find team for game; creating virtual team: {team.Id}, {team.Name}");
            return new TeamDto { Id = team.Id, Name = team.Name };
        }

        public void VisitMatch(GameMatch match)
        {
            ProcessPlayers(match.HomePlayers, _home);
            ProcessPlayers(match.AwayPlayers, _away);
        }

        private void ProcessPlayers(IEnumerable<GamePlayer> players, TeamDto team)
        {
            var teamSeason = team.Seasons.SingleOrDefault(s => s.SeasonId == _seasonId);
            if (teamSeason == null)
            {
                Trace.TraceWarning($"Team {team.Id} ({team.Name}) is not registered for season {_seasonId}; cannot build playerId -> teamMap");
                return;
            }

            foreach (var player in players)
            {
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