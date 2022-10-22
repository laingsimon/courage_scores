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
        var section = _configuration.GetSection("CosmosDb");

        var databaseName = section["DatabaseName"];
        var account = section["Account"];
        var key = section["Key"];
        var client = new CosmosClient(account, key);
        var database = await client.CreateDatabaseIfNotExistsAsync(databaseName);

        return database;
    }
}