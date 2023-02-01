using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public class DivisionTeamDetailsAdapter : IDivisionTeamDetailsAdapter
{
    public Task<DivisionTeamDetailsDto> Adapt(TeamDto team, CancellationToken token)
    {
        return Task.FromResult(new DivisionTeamDetailsDto
        {
            Id = team.Id,
            DivisionId = team.DivisionId,
            Name = team.Name,
        });
    }
}
