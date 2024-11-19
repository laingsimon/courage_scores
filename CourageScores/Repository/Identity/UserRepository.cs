using System.Diagnostics.CodeAnalysis;
using Microsoft.Azure.Cosmos;
using User = CourageScores.Models.Cosmos.Identity.User;

namespace CourageScores.Repository.Identity;

[ExcludeFromCodeCoverage]
public class UserRepository : IUserRepository
{
    private readonly Lazy<Container> _container;
    private readonly string _tableName;

    public UserRepository(Database database)
    {
        _tableName = nameof(User).ToLower();
        _container = new Lazy<Container>(() =>
            database.CreateContainerIfNotExistsAsync(_tableName, "/emailAddress").Result);
    }

    public async Task<User?> GetUser(string emailAddress)
    {
        await foreach (var item in Query($"select * from {_tableName} t where t.emailAddress = '{emailAddress}'"))
        {
            return item;
        }

        return default;
    }

    public async IAsyncEnumerable<User> GetAll()
    {
        await foreach (var user in Query($"select * from {_tableName} t"))
        {
            yield return user;
        }
    }

    public async Task<User> UpsertUser(User user)
    {
        await _container.Value.UpsertItemAsync(user, new PartitionKey(user.EmailAddress));
        return await GetUser(user.EmailAddress) ?? throw new InvalidOperationException("User could not be created");
    }

    private async IAsyncEnumerable<User> Query(string? query)
    {
        var iterator = _container.Value.GetItemQueryIterator<User>(query);
        while (iterator.HasMoreResults)
        {
            var nextResult = await iterator.ReadNextAsync();
            foreach (var item in nextResult)
            {
                yield return item;
            }
        }
    }
}