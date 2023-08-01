using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Command;

namespace CourageScores.Services.Season.Creation;

public class SeasonTemplateService : ISeasonTemplateService
{
    private readonly IGenericDataService<Template, TemplateDto> _underlyingService;

    public SeasonTemplateService(IGenericDataService<Template, TemplateDto> underlyingService)
    {
        _underlyingService = underlyingService;
    }

    #region delegating members
    [ExcludeFromCodeCoverage]
    public Task<TemplateDto?> Get(Guid id, CancellationToken token)
    {
        return _underlyingService.Get(id, token);
    }

    [ExcludeFromCodeCoverage]
    public IAsyncEnumerable<TemplateDto> GetAll(CancellationToken token)
    {
        return _underlyingService.GetAll(token);
    }

    [ExcludeFromCodeCoverage]
    public IAsyncEnumerable<TemplateDto> GetWhere(string query, CancellationToken token)
    {
        return _underlyingService.GetWhere(query, token);
    }

    [ExcludeFromCodeCoverage]
    public Task<ActionResultDto<TemplateDto>> Upsert<TOut>(Guid id, IUpdateCommand<Template, TOut> updateCommand, CancellationToken token)
    {
        return _underlyingService.Upsert(id, updateCommand, token);
    }

    [ExcludeFromCodeCoverage]
    public Task<ActionResultDto<TemplateDto>> Delete(Guid id, CancellationToken token)
    {
        return _underlyingService.Delete(id, token);
    }
    #endregion
}