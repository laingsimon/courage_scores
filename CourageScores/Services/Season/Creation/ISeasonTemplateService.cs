using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Services.Season.Creation;

public interface ISeasonTemplateService : IGenericDataService<Template, TemplateDto>
{
    Task<ActionResultDto<List<ActionResultDto<TemplateDto>>>> GetForSeason(Guid seasonId, CancellationToken token);
}