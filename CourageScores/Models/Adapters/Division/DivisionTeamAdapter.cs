using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Division;

namespace CourageScores.Models.Adapters.Division;

public class DivisionTeamAdapter : IDivisionTeamAdapter
{
    public Task<DivisionTeamDto> Adapt(TeamDto team, DivisionData.Score score, CancellationToken token)
    {
        return Task.FromResult(new DivisionTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Played = score.TeamPlayed,
            Points = score.CalculatePoints(),
            Won = score.Win,
            Lost = score.Lost,
            Drawn = score.Draw,
            Difference = 0,
            Address = team.Address,
        });
    }

    public Task<DivisionTeamDto> WithoutFixtures(TeamDto team, CancellationToken token)
    {
        return Task.FromResult(new DivisionTeamDto
        {
            Id = team.Id,
            Address = team.Address,
            Played = 0,
            Name = team.Name,
            Points = 0,
        });
    }
}