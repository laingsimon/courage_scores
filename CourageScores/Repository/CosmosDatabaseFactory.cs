using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CourageScores.Repository;

[ExcludeFromCodeCoverage]
public class CosmosDatabaseFactory : ICosmosDatabaseFactory
{
    private readonly IConfiguration _configuration;
    private readonly Lazy<Database> _getDatabase;

    public CosmosDatabaseFactory(IConfiguration configuration)
    {
        _configuration = configuration;
        _getDatabase = new Lazy<Database>(() => GetOrCreateDatabase().Result, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public Task<Database> CreateDatabase()
    {
        return Task.FromResult(_getDatabase.Value);
    }

    private async Task<Database> GetOrCreateDatabase()
    {
        var throughput = int.TryParse(_configuration["DatabaseScale"], out var scale)
            ? ThroughputProperties.CreateAutoscaleThroughput(scale)
            : ThroughputProperties.CreateAutoscaleThroughput(1000);

        var databaseName = _configuration["CosmosDb_DatabaseName"];
        var account = _configuration["CosmosDb_Endpoint"];
        var key = _configuration["CosmosDb_Key"];

        var serialiserSettings = new JsonSerializerSettings
        {
            Converters =
            {
                new StringEnumConverter(),
            }
        };
        var clientOptions = new CosmosClientOptions
        {
            Serializer = CreateSerialiser(serialiserSettings),
        };
        var client = new CosmosClient(account, key, clientOptions);
        return await client.CreateDatabaseIfNotExistsAsync(databaseName, throughput);
    }

    private static CosmosSerializer? CreateSerialiser(JsonSerializerSettings serializerSettings)
    {
        const string serialiserTypeName = "Microsoft.Azure.Cosmos.CosmosJsonDotNetSerializer";
        var cosmosAssembly = Assembly.GetAssembly(typeof(CosmosSerializer))!;
        var serialiserType = cosmosAssembly.GetTypes().SingleOrDefault(t => t.FullName == serialiserTypeName);
        if (serialiserType == null)
        {
            return null;
        }

        var constructor = serialiserType.GetConstructor(
            BindingFlags.Instance | BindingFlags.NonPublic,
            [typeof(JsonSerializerSettings), typeof(bool)]);
        if (constructor == null)
        {
            return null;
        }

        return (CosmosSerializer?)constructor.Invoke([serializerSettings, false]);
    }
}
