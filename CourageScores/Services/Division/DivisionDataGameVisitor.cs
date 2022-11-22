using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;

namespace CourageScores.Services.Division;

public class DivisionDataGameVisitor : IGameVisitor
{
    private readonly DivisionData _divisionData;

    public DivisionDataGameVisitor(DivisionData divisionData)
    {
        _divisionData = divisionData;
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

    public void VisitMatchDraw(IReadOnlyCollection<GamePlayer> homePlayers, IReadOnlyCollection<GamePlayer> awayPlayers)
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

    public void VisitOneEighty(GamePlayer player)
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
            score.Played++;
        }
        else
        {
            _divisionData.Teams.Add(team.Id, new DivisionData.Score { Played = 1, Team = team });
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
            score.Played++;
        }
        else
        {
            _divisionData.Players.Add(player.Id, new DivisionData.Score { Played = 1, Player = player });
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
}