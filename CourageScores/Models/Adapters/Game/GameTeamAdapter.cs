using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Game;

public class GameTeamAdapter : IAdapter<GameTeam, GameTeamDto>
{
    private readonly IUserService _userService;

    public GameTeamAdapter(IUserService userService)
    {
        _userService = userService;
    }

    public async Task<GameTeamDto> Adapt(GameTeam model)
    {
        var isAdmin = (await _userService.GetUser())?.Access?.ManageScores == true;

        return new GameTeamDto
        {
            Id = model.Id,
            Name = model.Name,
            ManOfTheMatch = model.ManOfTheMatch == null
                ? null
                : isAdmin
                    ? model.ManOfTheMatch
                    : Guid.Empty,
        }.AddAuditProperties(model);
    }

    public Task<GameTeam> Adapt(GameTeamDto dto)
    {
        return Task.FromResult(new GameTeam
        {
            Id = dto.Id,
            Name = dto.Name,
            ManOfTheMatch = dto.ManOfTheMatch,
        }.AddAuditProperties(dto));
    }
}