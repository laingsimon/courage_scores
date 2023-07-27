using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Models.Adapters.Health;

public class LeagueFixtureHealthDtoAdapter : ISimpleOnewayAdapter<DivisionFixtureDto, LeagueFixtureHealthDto?>
{
    public Task<LeagueFixtureHealthDto?> Adapt(DivisionFixtureDto model, CancellationToken token)
    {
        if (model.IsKnockout || model.AwayTeam == null)
        {
            return Task.FromResult<LeagueFixtureHealthDto?>(null);
        }

        return Task.FromResult<LeagueFixtureHealthDto?>(new LeagueFixtureHealthDto
        {
            Id = model.Id,
            Date = model.Date,
            HomeTeam = model.HomeTeam.Name,
            HomeTeamAddress = model.HomeTeam.Address?.Trim(),
            HomeTeamId = model.HomeTeam.Id,
            AwayTeam = model.AwayTeam.Name,
            AwayTeamAddress = model.AwayTeam.Address?.Trim(),
            AwayTeamId = model.AwayTeam.Id,
        });
    }
}