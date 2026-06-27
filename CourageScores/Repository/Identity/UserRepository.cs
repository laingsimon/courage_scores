using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Dtos.Identity;
using Microsoft.Azure.Cosmos;
using User = CourageScores.Models.Cosmos.Identity.User;

namespace CourageScores.Repository.Identity;

[ExcludeFromCodeCoverage]
public class UserRepository : IUserRepository
{
    private readonly IAccessLevelAdapter _accessLevelAdapter;
    private readonly Lazy<Container> _container;
    private readonly string _tableName;

    public UserRepository(Database database, IAccessLevelAdapter accessLevelAdapter)
    {
        _accessLevelAdapter = accessLevelAdapter;
        _tableName = nameof(User).ToLower();
        _container = new Lazy<Container>(() =>
            database.CreateContainerIfNotExistsAsync(_tableName, "/emailAddress").Result);
    }

    public async Task<User?> GetUser(string emailAddress, CancellationToken token)
    {
        await foreach (var item in Query($"select * from {_tableName} t where t.emailAddress = '{emailAddress}'", token))
        {
            return await PatchUserAccess(item, token);
        }

        return null;
    }

    public async IAsyncEnumerable<User> GetAll([EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var user in Query($"select * from {_tableName} t", token))
        {
            yield return await PatchUserAccess(user, token);
        }
    }

    public async Task<User> UpsertUser(User user, CancellationToken token)
    {
        await _container.Value.UpsertItemAsync(user, new PartitionKey(user.EmailAddress), cancellationToken: token);
        return await GetUser(user.EmailAddress, token) ?? throw new InvalidOperationException("User could not be created");
    }

    public async Task DeleteUser(User user, CancellationToken token)
    {
        var partitionKey = new PartitionKey(user.EmailAddress);
        await _container.Value.DeleteItemAsync<User>(user.Id.ToString(), partitionKey, cancellationToken: token);
    }

    private async IAsyncEnumerable<User> Query(string? query, [EnumeratorCancellation] CancellationToken token)
    {
        var iterator = _container.Value.GetItemQueryIterator<User>(query);
        while (iterator.HasMoreResults)
        {
            var nextResult = await iterator.ReadNextAsync(token);
            foreach (var item in nextResult)
            {
                yield return await PatchUserAccess(item, token);
            }
        }
    }

    private async Task<User> PatchUserAccess(User user, CancellationToken token)
    {
        if (user.AccessLevels.Count > 0 || user.Transient)
        {
            // already patched
            return user;
        }

        var intermediary = await _accessLevelAdapter.AddAccess(new UserDto(), user, token);

        if (intermediary.AccessLevels.Count == user.AccessLevels.Count)
        {
            // already patched
            return user;
        }

        user = await _accessLevelAdapter.AddAccess(user, intermediary, token);
        await _container.Value.UpsertItemAsync(user, new PartitionKey(user.EmailAddress), cancellationToken: token);
        return user;
    }
}
