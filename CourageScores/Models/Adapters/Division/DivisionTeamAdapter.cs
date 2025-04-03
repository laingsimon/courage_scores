using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public class DivisionTeamAdapter : IDivisionTeamAdapter
{
    public Task<DivisionTeamDto> Adapt(TeamDto team, DivisionData.TeamScore score, IReadOnlyCollection<DivisionPlayerDto> players, DivisionDto? division, CancellationToken token)
    {
        var winRate = players.Sum(p => p.Singles.TeamWinRate + p.Pairs.TeamWinRate + p.Triples.TeamWinRate);
        var lossRate = players.Sum(p => p.Singles.TeamLossRate + p.Pairs.TeamLossRate + p.Triples.TeamLossRate);

        return Task.FromResult(new DivisionTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Played = score.FixturesPlayed,
            Points = score.CalculatePoints(),
            FixturesWon = score.FixturesWon,
            FixturesLost = score.FixturesLost,
            FixturesDrawn = score.FixturesDrawn,
            Difference = winRate - lossRate,
            Address = team.AddressOrName(),
            MatchesWon = players.Sum(p => p.Singles.MatchesWon + p.Pairs.MatchesWon + p.Triples.MatchesWon),
            MatchesLost = players.Sum(p => p.Singles.MatchesLost + p.Pairs.MatchesLost + p.Triples.MatchesLost),
            WinRate = winRate,
            LossRate = lossRate,
            Updated = team.Updated,
            Division = division,
        });
    }

    public Task<DivisionTeamDto> WithoutFixtures(TeamDto team, DivisionDto? division, CancellationToken token)
    {
        return Task.FromResult(new DivisionTeamDto
        {
            Id = team.Id,
            Address = team.AddressOrName(),
            Played = 0,
            Name = team.Name,
            Points = 0,
            Updated = team.Updated,
            Division = division,
        });
    }
}