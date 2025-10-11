using System.Diagnostics.CodeAnalysis;
using CourageScores.Repository;
using Microsoft.Azure.Cosmos;

namespace CourageScores.StubCosmos.Api;

[ExcludeFromCodeCoverage]
public class StubCosmosDatabaseFactory : ICosmosDatabaseFactory
{
    private Database? _database;

    public Task<Database> CreateDatabase()
    {
        return Task.FromResult(_database ??= new StubCosmosDatabase());
    }
}
