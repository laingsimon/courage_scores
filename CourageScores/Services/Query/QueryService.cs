using CourageScores.Common;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Query;
using CourageScores.Services.Data;
using CourageScores.Services.Identity;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json;
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
        try
        {
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
        catch (CosmosException exc)
        {
            var errorResponse = GetErrorResponse(exc);
            if (errorResponse != null)
            {
                return new ActionResultDto<QueryResponseDto>
                {
                    Warnings = errorResponse.Errors.Select(e => e.Message).ToList(),
                };
            }

            return new ActionResultDto<QueryResponseDto>
            {
                Errors =
                {
                    exc.Message,
                }
            };
        }
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

    private static ErrorResponse? GetErrorResponse(CosmosException exc)
    {
        try
        {
            var error = exc.GetError();
            var outerMessage = JObject.Parse(error["message"]!.Value<string>()!);
            var innerMessage = outerMessage["message"]!.Value<string>()!;
            return JsonConvert.DeserializeObject<ErrorResponse>(innerMessage.Substring(0, innerMessage.LastIndexOf("}") + 1));
        }
        catch (Exception)
        {
            return null;
        }
    }

    private class ErrorResponse
    {
        [JsonProperty("errors")]
        public required ErrorDetail[] Errors { get; set; }
    }

    private class ErrorDetail
    {
        [JsonProperty("severity")]
        public required string Severity { get; set; }
        [JsonProperty("location")]
        public required object Location { get; set; }
        [JsonProperty("code")]
        public required string Code { get; set; }
        [JsonProperty("message")]
        public required string Message { get; set; }
    }
}
