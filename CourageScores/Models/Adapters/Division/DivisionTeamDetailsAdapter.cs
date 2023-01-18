using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public class DivisionTeamDetailsAdapter : IDivisionTeamDetailsAdapter
{
    public Task<DivisionTeamDetailsDto> Adapt(TeamDto team)
    {
        return Task.FromResult(new DivisionTeamDetailsDto
        {
            Id = team.Id,
            Name = team.Name,
        });
    }
}