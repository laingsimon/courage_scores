using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services.Identity;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Services.Data;

public class CosmosTableService : ICosmosTableService
{
    private readonly Database _database;
    private readonly IUserService _userService;
    private readonly IJsonSerializerService _serializer;

    public CosmosTableService(Database database, IUserService userService, IJsonSerializerService serializer)
    {
        _database = database;
        _userService = userService;
        _serializer = serializer;
    }

    public async IAsyncEnumerable<ITableAccessor> GetTables(ExportDataRequestDto request, [EnumeratorCancellation] CancellationToken token)
    {
        var specifiedTablesOnly = request.Tables.Any();

        await foreach (var table in GetTables(token))
        {
            if (!specifiedTablesOnly || request.Tables.ContainsKey(table.Name))
            {
                yield return new TableAccessor(table.Name, table.PartitionKey);
            }
        }
    }

    public async IAsyncEnumerable<TableDto> GetTables([EnumeratorCancellation] CancellationToken token)
    {
        var typeLookup = typeof(IPermissionedEntity).Assembly.GetTypes()
            .Where(t => t.IsAssignableTo(typeof(IPermissionedEntity)) && !t.IsAbstract)
            .ToDictionary(t => t.Name, StringComparer.OrdinalIgnoreCase);

        var iterator = _database.GetContainerQueryStreamIterator();
        while (iterator.HasMoreResults)
        {
            var container = await iterator.ReadNextAsync(token);
            var containerContent = _serializer.DeserialiseTo<ContainerItemJson>(container.Content);

            foreach (var table in containerContent.DocumentCollections)
            {
                var tableName = table.Id;

                var partitionKey = table.PartitionKey.Paths.Single();
                typeLookup.TryGetValue(tableName, out var dataType);

                yield return new TableDto
                {
                    Name = tableName,
                    PartitionKey = partitionKey,
                    DataType = dataType,
                    CanImport = await CanImportDataType(dataType, token),
                    CanExport = await CanExportDataType(token),
                };
            }
        }
    }

    private async Task<bool> CanExportDataType(CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return false;
        }

        return user.Access?.ExportData == true;
    }

    private async Task<bool> CanImportDataType(Type? dataType, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null || user.Access?.ImportData != true)
        {
            return false;
        }

        if (dataType == null)
        {
            return false;
        }

        var instance = (IPermissionedEntity) Activator.CreateInstance(dataType)!;
        return instance.CanCreate(user) && instance.CanEdit(user) && instance.CanDelete(user);
    }
}