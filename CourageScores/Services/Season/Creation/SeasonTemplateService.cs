using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Command;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
using CourageScores.Services.Season.Creation.CompatibilityCheck;

namespace CourageScores.Services.Season.Creation;

public class SeasonTemplateService : ISeasonTemplateService
{
    private readonly IGenericDataService<Template, TemplateDto> _underlyingService;
    private readonly IUserService _userService;
    private readonly ISeasonService _seasonService;
    private readonly IDivisionService _divisionService;
    private readonly ICompatibilityCheckFactory _compatibilityCheckFactory;

    public SeasonTemplateService(
        IGenericDataService<Template, TemplateDto> underlyingService,
        IUserService userService,
        ISeasonService seasonService,
        IDivisionService divisionService,
        ICompatibilityCheckFactory compatibilityCheckFactory)
    {
        _underlyingService = underlyingService;
        _userService = userService;
        _seasonService = seasonService;
        _divisionService = divisionService;
        _compatibilityCheckFactory = compatibilityCheckFactory;
    }

    public async Task<ActionResultDto<List<ActionResultDto<TemplateDto>>>> GetForSeason(Guid seasonId, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Error<List<ActionResultDto<TemplateDto>>>("Not logged in");
        }

        if (user.Access?.ManageGames != true && user.Access?.ManageSeasonTemplates != true)
        {
            return Error<List<ActionResultDto<TemplateDto>>>("Not permitted");
        }

        var season = await _seasonService.Get(seasonId, token);
        if (season == null)
        {
            return Error<List<ActionResultDto<TemplateDto>>>("Season not found");
        }

        var context = await CreateContext(season, token);
        return new ActionResultDto<List<ActionResultDto<TemplateDto>>>
        {
            Success = true,
            Result = await _underlyingService.GetAll(token).SelectAsync(t => MatchToSeason(t, context, token)).ToList(),
        };
    }

    private async Task<TemplateMatchContext> CreateContext(SeasonDto season, CancellationToken token)
    {
        var divisions = await season.Divisions.SelectAsync(d => _divisionService.GetDivisionData(new DivisionDataFilter
        {
            DivisionId = d.Id,
            SeasonId = season.Id,
        }, token)).ToList();

        return new TemplateMatchContext(season, divisions);
    }

    private async Task<ActionResultDto<TemplateDto>> MatchToSeason(TemplateDto template, TemplateMatchContext context, CancellationToken token)
    {
        var compatible = await _compatibilityCheckFactory.CreateChecks().Check(template, context, token);
        if (!compatible.Success)
        {
            return compatible;
        }

        return new ActionResultDto<TemplateDto>
        {
            Success = true,
            Result = template,
        };
    }

    private static ActionResultDto<T> Error<T>(string error)
    {
        return new ActionResultDto<T>
        {
            Success = false,
            Errors = { error },
        };
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