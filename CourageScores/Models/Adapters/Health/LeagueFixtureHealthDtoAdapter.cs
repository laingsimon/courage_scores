using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Models.Adapters.Health;

public class LeagueFixtureHealthDtoAdapter : ISimpleOnewayAdapter<LeagueFixtureHealthDtoAdapter.FixtureDateMapping, LeagueFixtureHealthDto?>
{
    public Task<LeagueFixtureHealthDto?> Adapt(FixtureDateMapping model, CancellationToken token)
    {
        if (model.Fixture.IsKnockout || model.Fixture.AwayTeam == null)
        {
            return Task.FromResult<LeagueFixtureHealthDto?>(null);
        }

        return Task.FromResult<LeagueFixtureHealthDto?>(new LeagueFixtureHealthDto
        {
            Id = model.Fixture.Id,
            Date = model.Date,
            HomeTeam = model.Fixture.HomeTeam.Name,
            HomeTeamAddress = model.Fixture.HomeTeam.Address?.Trim(),
            HomeTeamId = model.Fixture.HomeTeam.Id,
            AwayTeam = model.Fixture.AwayTeam.Name,
            AwayTeamAddress = model.Fixture.AwayTeam.Address?.Trim(),
            AwayTeamId = model.Fixture.AwayTeam.Id,
        });
    }

    public class FixtureDateMapping
    {
        public DateTime Date { get; }
        public DivisionFixtureDto Fixture { get; }

        public FixtureDateMapping(DateTime date, DivisionFixtureDto fixture)
        {
            Date = date;
            Fixture = fixture;
        }
    }
}