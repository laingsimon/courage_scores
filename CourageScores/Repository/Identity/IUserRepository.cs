using CourageScores.Models.Cosmos.Identity;

namespace CourageScores.Repository.Identity;

public interface IUserRepository
{
    Task<User?> GetUser(string emailAddress, CancellationToken token);
    Task<User> UpsertUser(User user, CancellationToken token);
    IAsyncEnumerable<User> GetAll(CancellationToken token);
    Task DeleteUser(User user, CancellationToken token);
}
