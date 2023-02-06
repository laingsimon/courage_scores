using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services;
using CourageScores.Services.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace DataImport;

public class CosmosDatabase
{
    private readonly string _host;
    private readonly string _key;
    private readonly string _databaseName;
    private Database? _database;
    private readonly JsonSerializerService _serializer;

    public CosmosDatabase(string host, string key, string? databaseName = null)
    {
        _host = string.IsNullOrEmpty(host) ? GetEnvironmentVariable("CosmosDb_Endpoint") : host;
        _key = string.IsNullOrEmpty(key) ? GetEnvironmentVariable("CosmosDb_Key") : key;
        _databaseName = string.IsNullOrEmpty(databaseName) ? "league" + DateTime.UtcNow.ToString("yyyyMMddHHmm") : databaseName;
        _serializer = new JsonSerializerService(new JsonSerializer());
    }

    private string GetEnvironmentVariable(string name)
    {
        return Environment.GetEnvironmentVariable(name) ?? throw new InvalidOperationException("Environment variable not set: " + name);
    }

    public async Task OpenAsync(CancellationToken token)
    {
        var client = new CosmosClient(_host, _key);
        _database = await client.CreateDatabaseIfNotExistsAsync(_databaseName, cancellationToken: token);
    }

    public async IAsyncEnumerable<TableDto> GetTables([EnumeratorCancellation] CancellationToken token)
    {
        var typeLookup = typeof(IPermissionedEntity).Assembly.GetTypes()
            .Where(t => t.IsAssignableTo(typeof(IPermissionedEntity)) && !t.IsAbstract)
            .ToDictionary(t => t.Name, StringComparer.OrdinalIgnoreCase);

        var iterator = _database!.GetContainerQueryStreamIterator();
        while (iterator.HasMoreResults && !token.IsCancellationRequested)
        {
            var result = await iterator.ReadNextAsync(token);
            var item = _serializer.DeserialiseTo<ContainerItemJson>(result.Content);
            foreach (var collection in item.DocumentCollections)
            {
                typeLookup.TryGetValue(collection.Id, out var dataType);

                yield return new TableDto
                {
                    Name = collection.Id,
                    PartitionKey = collection.PartitionKey.Paths.Single(),
                    DataType = dataType,
                };
            }
        }
    }

    public async IAsyncEnumerable<T> GetTable<T>(TableDto table, [EnumeratorCancellation] CancellationToken token)
    {
        Container container = await _database!.CreateContainerIfNotExistsAsync(table.Name, table.PartitionKey, cancellationToken: token);
        var records = container.GetItemQueryIterator<JObject>();

        while (records.HasMoreResults && !token.IsCancellationRequested)
        {
            var record = await records.ReadNextAsync(token);

            foreach (var row in record)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }

                yield return row.ToObject<T>();
            }
        }
    }
}