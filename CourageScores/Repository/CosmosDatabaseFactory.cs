using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

public class CosmosDatabaseFactory : ICosmosDatabaseFactory
{
    private readonly IConfiguration _configuration;

    public CosmosDatabaseFactory(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<Database> CreateDatabase()
    {
        var databaseName = _configuration["CosmosDb_DatabaseName"];
        var account = _configuration["CosmosDb_Endpoint"];
        var key = _configuration["CosmosDb_Key"];
        var client = new CosmosClient(account, key);
        var database = await client.CreateDatabaseIfNotExistsAsync(databaseName);

        return database;
    }
}