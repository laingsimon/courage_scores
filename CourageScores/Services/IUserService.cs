using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services;

public interface IUserService
{
    Task<UserDto?> GetUser();
}