using CourageScores.Repository;
using CourageScores.Repository.Identity;
using CourageScores.Sandbox.Auth;
using CourageScores.StubCosmos.Api;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Sandbox.Cosmos;

public class SandboxCosmosDatabaseFactory : ICosmosDatabaseFactory, IStubCosmosData
{
    private Database? _database;
    private readonly ICosmosDatabaseFactory _stubDatabaseFactory;

    public SandboxCosmosDatabaseFactory(StubCosmosDatabaseFactory stubDatabaseFactory)
    {
        _stubDatabaseFactory = stubDatabaseFactory;
    }

    public async Task<Database> CreateDatabase()
    {
        return _database ??= await CreateDatabaseWithAdminUser();
    }

    private async Task<Database> CreateDatabaseWithAdminUser()
    {
        var database = await _stubDatabaseFactory.CreateDatabase();
        var userRepo = new UserRepository(database);

        await TestAuthenticationService.AddAdminUserToContainer(userRepo);

        return database;
    }

    public Task Clear()
    {
        _database = null;
        return Task.CompletedTask;
    }
}
