using CourageScores.Models.Cosmos.Identity;

namespace CourageScores.Repository;

public interface IUserRepository
{
    Task<User?> GetUser(string emailAddress);
    Task<User> UpsertUser(User user);
}