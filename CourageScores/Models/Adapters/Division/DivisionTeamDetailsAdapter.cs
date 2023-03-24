using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public class DivisionTeamDetailsAdapter : IDivisionTeamDetailsAdapter
{
    public Task<DivisionTeamDetailsDto> Adapt(TeamDto teamInSeason, SeasonDto season, CancellationToken token)
    {
        var teamSeason = teamInSeason.Seasons.SingleOrDefault(ts => ts.SeasonId == season.Id);

        return Task.FromResult(new DivisionTeamDetailsDto
        {
            Id = teamInSeason.Id,
            DivisionId = teamSeason?.DivisionId ?? Guid.Empty,
            Name = teamInSeason.Name,
        });
    }
}
