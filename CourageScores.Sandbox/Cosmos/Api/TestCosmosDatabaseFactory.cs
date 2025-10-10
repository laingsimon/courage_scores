using CourageScores.Repository;
using CourageScores.Repository.Identity;
using CourageScores.Sandbox.Auth;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Sandbox.Cosmos.Api;

public class TestCosmosDatabaseFactory : ICosmosDatabaseFactory
{
    private readonly IServiceProvider _serviceProvider;
    private Database? _database;

    public TestCosmosDatabaseFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task<Database> CreateDatabase()
    {
        return _database ??= await CreateDatabaseWithAdminUser(_serviceProvider);
    }

    private static async Task<Database> CreateDatabaseWithAdminUser(IServiceProvider serviceProvider)
    {
        var database = new TestCosmosDatabase();
        var userRepo = new UserRepository(database);

        await TestAuthenticationService.AddAdminUserToContainer(userRepo);

        return database;
    }
}
