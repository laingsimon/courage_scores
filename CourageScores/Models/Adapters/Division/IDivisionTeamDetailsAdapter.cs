using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public interface IDivisionTeamDetailsAdapter
{
    Task<DivisionTeamDetailsDto> Adapt(TeamDto teamInSeason, SeasonDto season, CancellationToken token);
}