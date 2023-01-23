using System.Data;
using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos.Data;
using CourageScores.Services.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json.Linq;

namespace DataImport;

public class CosmosDatabase
{
    private readonly string _host;
    private readonly string _key;
    private readonly string _databaseName;
    private Database? _database;

    public CosmosDatabase(string host, string key, string? databaseName = null)
    {
        _host = string.IsNullOrEmpty(host) ? GetEnvironmentVariable("CosmosDb_Endpoint") : host;
        _key = string.IsNullOrEmpty(key) ? GetEnvironmentVariable("CosmosDb_Key") : key;
        _databaseName = string.IsNullOrEmpty(databaseName) ? "league" + DateTime.UtcNow.ToString("yyyyMMddHHmm") : databaseName;
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
            var item = ContainerItemJson.ReadContainerStream(result.Content);
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

    public async Task<DataTable> GetTable(TableDto table, CancellationToken token)
    {
        Container container = await _database!.CreateContainerIfNotExistsAsync(table.Name, table.PartitionKey, cancellationToken: token);
        var records = container.GetItemQueryIterator<JObject>();

        var data = new DataTable();

        while (records.HasMoreResults && !token.IsCancellationRequested)
        {
            var record = await records.ReadNextAsync(token);

            foreach (var row in record)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }

                AddRowToTable(row, data, table.DataType);
            }
        }

        return data;
    }

    private void AddRowToTable(JObject row, DataTable table, Type? type)
    {
        if (!table.Columns.Contains("_raw"))
        {
            table.Columns.Add("_raw", typeof(string));
        }

        if (type != null && !table.Columns.Contains("value"))
        {
            table.Columns.Add("value", type);
        }

        if (type != null)
        {
            table.Rows.Add(row.ToString(), Deserialise(row, type));
        }
        else
        {
            table.Rows.Add(row.ToString());
        }
    }

    private static object Deserialise(JToken row, Type type)
    {
        return row.ToObject(type);
    }
}