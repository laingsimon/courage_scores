using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Identity;

public class AccessService : IAccessService
{
    private readonly IUserService _userService;

    public AccessService(IUserService userService)
    {
        _userService = userService;
    }

    public async Task<bool> CanEditTeam(TeamDto team)
    {
        var user = await _userService.GetUser();
        return user?.Access?.TeamAdmin == true;
    }

    public async Task<bool> CanEditTeam(Models.Cosmos.Team.Team team)
    {
        var user = await _userService.GetUser();
        return user?.Access?.TeamAdmin == true;
    }

    public async Task<bool> CanDeleteTeam(Models.Cosmos.Team.Team team)
    {
        var user = await _userService.GetUser();
        return user?.Access?.TeamAdmin == true;
    }
}