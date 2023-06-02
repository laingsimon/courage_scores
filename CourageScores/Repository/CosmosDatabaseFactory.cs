using System.Diagnostics.CodeAnalysis;
using Microsoft.Azure.Cosmos;

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
        var client = new CosmosClient(account, key);
        return await client.CreateDatabaseIfNotExistsAsync(databaseName, throughput);
    }
}