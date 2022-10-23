using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services;

public interface IIdentityService
{
    Task<UserDto?> GetUser();
}