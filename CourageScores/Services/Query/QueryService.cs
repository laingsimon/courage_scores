using CourageScores.Common;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Models.Dtos.Query;
using CourageScores.Services.Data;
using CourageScores.Services.Identity;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Services.Query;

public class QueryService : IQueryService
{
    private readonly Database _database;
    private readonly ICosmosTableService _cosmosTableService;
    private readonly IUserService _userService;

    public QueryService(
        Database database,
        ICosmosTableService cosmosTableService,
        IUserService userService)
    {
        _database = database;
        _cosmosTableService = cosmosTableService;
        _userService = userService;
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

        var exportRequest = new ExportDataRequestDto
        {
#pragma warning disable CS0618 // Type or member is obsolete
            Tables =
            {
                { request.Table, [] },
            },
#pragma warning restore CS0618 // Type or member is obsolete
        };
        var tables = await _cosmosTableService.GetTables(exportRequest, token).ToList();
        var table = tables.Count == 1 ? tables[0] : null;
        if (table == null)
        {
            return Warning("Table not found");
        }

        var rows = await table
            .SelectRows(_database, request.IncludeDeleted, token)
            .Filter(request.Filters, request.Settings, token)
            .SelectProperties(request.Columns)
            .ToList();
        return new ActionResultDto<QueryResponseDto>
        {
            Result = new QueryResponseDto
            {
                Query = request,
                Rows = rows,
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
