using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Season.Creation;

public class FixtureTemplateAdapter : ISimpleAdapter<FixtureTemplate, FixtureTemplateDto>
{
    public Task<FixtureTemplateDto> Adapt(FixtureTemplate model, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new FixtureTemplateDto
        {
            Home = new TeamPlaceholderDto(model.Home),
            Away = string.IsNullOrEmpty(model.Away) ? null : new TeamPlaceholderDto(model.Away),
        });
    }

    public Task<FixtureTemplate> Adapt(FixtureTemplateDto dto, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new FixtureTemplate
        {
            Home = dto.Home.Key,
            Away = dto.Away?.Key,
        });
    }
}
