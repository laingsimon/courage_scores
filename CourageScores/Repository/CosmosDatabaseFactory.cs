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
        _getDatabase = new Lazy<Database>(() => CreateDatabaseInternal().Result, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public Task<Database> CreateDatabase()
    {
        return Task.FromResult(_getDatabase.Value);
    }

    private async Task<Database> CreateDatabaseInternal()
    {
        var databaseName = _configuration["CosmosDb_DatabaseName"];
        var account = _configuration["CosmosDb_Endpoint"];
        var key = _configuration["CosmosDb_Key"];
        var client = new CosmosClient(account, key);
        var database = await client.CreateDatabaseIfNotExistsAsync(databaseName);

        return database;
    }
}