using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public interface IUserService
{
    Task<UserDto?> GetUser();
    Task<ActionResultDto<UserDto>> UpdateAccess(UpdateAccessDto user);
}