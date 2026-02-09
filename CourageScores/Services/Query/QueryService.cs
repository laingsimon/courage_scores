using CourageScores.Common;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Query;
using CourageScores.Services.Data;
using CourageScores.Services.Identity;
using Microsoft.Azure.Cosmos;

using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Query;

public class QueryService : IQueryService
{
    private readonly Database _database;
    private readonly IUserService _userService;
    private readonly ICosmosTableService _cosmosTableService;

    public QueryService(
        Database database,
        IUserService userService,
        ICosmosTableService cosmosTableService)
    {
        _database = database;
        _userService = userService;
        _cosmosTableService = cosmosTableService;
    }

    public async Task<ActionResultDto<QueryResponseDto>> ExecuteQuery(QueryRequestDto request, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Warning("Not logged in");
        }

        if (user.Access?.RunDataQueries != true)
        {
            return Warning("Not permitted");
        }

        var tables = await _cosmosTableService.GetTables(token).WhereAsync(t => t.Name.Equals(request.Container, StringComparison.OrdinalIgnoreCase)).ToList();
        var table = tables.Count == 1 ? tables[0] : null;
        if (table == null)
        {
            return Warning("Table not found");
        }

        var options = new QueryRequestOptions();
        var rows = await _database
            .GetContainer(request.Container)
            .GetItemQueryIterator<JObject>(request.Query, requestOptions: options)
            .EnumerateResults(token)
            .ExcludeCosmosProperties()
            .ToList();
        request.Max ??= 10;

        return new ActionResultDto<QueryResponseDto>
        {
            Result = new QueryResponseDto
            {
                Request = request,
                Rows = rows.Take(request.Max.Value).ToList(),
                RowCount = rows.Count,
            },
            Success = true,
        };
    }

    private static ActionResultDto<QueryResponseDto> Warning(string message)
    {
        return new ActionResultDto<QueryResponseDto>
        {
            Warnings =
            {
                message
            },
        };
    }
}
