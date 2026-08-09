using CourageScores.Common;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Health;

public class DivisionDateHealthDtoAdapter : ISimpleOnewayAdapter<DivisionFixtureDateDto, DivisionDateHealthDto>
{
    private readonly ISimpleOnewayAdapter<LeagueFixtureHealthDtoAdapter.FixtureDateMapping, LeagueFixtureHealthDto?> _fixtureAdapter;

    public DivisionDateHealthDtoAdapter(ISimpleOnewayAdapter<LeagueFixtureHealthDtoAdapter.FixtureDateMapping, LeagueFixtureHealthDto?> fixtureAdapter)
    {
        _fixtureAdapter = fixtureAdapter;
    }

    public async Task<DivisionDateHealthDto> Adapt(DivisionFixtureDateDto model, UserAccessContext context, CancellationToken token)
    {
        return new DivisionDateHealthDto
        {
            Date = model.Date,
            Fixtures = await model.Fixtures
                .SelectAsync(f => _fixtureAdapter.Adapt(new LeagueFixtureHealthDtoAdapter.FixtureDateMapping(model.Date, f), context, token))
                .WhereAsync(f => f != null)
                .SelectAsync(f => f!)
                .ToList(),
        };
    }
}
