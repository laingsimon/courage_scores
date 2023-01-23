using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public interface IUserService
{
    Task<UserDto?> GetUser(CancellationToken token);
    Task<ActionResultDto<UserDto>> UpdateAccess(UpdateAccessDto user, CancellationToken token);
    Task<UserDto?> GetUser(string emailAddress, CancellationToken token);
    IAsyncEnumerable<UserDto> GetAll(CancellationToken token);
}