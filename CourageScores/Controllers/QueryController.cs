using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Query;
using CourageScores.Services.Command;
using CourageScores.Services.Query;
using CourageScores.Services.Team;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class QueryController : Controller
{
    private readonly IQueryService _queryService;

    public QueryController(IQueryService queryService)
    {
        _queryService = queryService;
    }

    [HttpPost("/api/Query/")]
    public async Task<ActionResultDto<QueryResponseDto>> Execute(QueryRequestDto request, CancellationToken token)
    {
        try
        {
            return await _queryService.ExecuteQuery(request, token);
        }
        catch (Exception exc)
        {
            return new ActionResultDto<QueryResponseDto>
            {
                Errors =
                {
                    exc.Message,
                }
            };
        }
    }
}
