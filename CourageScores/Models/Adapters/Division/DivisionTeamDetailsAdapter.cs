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
#pragma warning disable CS0618
            DivisionId = teamSeason?.DivisionId ?? teamInSeason.DivisionId,
#pragma warning restore CS0618
            Name = teamInSeason.Name,
        });
    }
}
