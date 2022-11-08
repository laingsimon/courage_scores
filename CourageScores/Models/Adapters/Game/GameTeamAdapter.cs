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

    public GameTeamDto Adapt(GameTeam model)
    {
        var isAdmin = _userService.GetUser().Result?.Access?.GameAdmin == true;

        return new GameTeamDto
        {
            Id = model.Id,
            Name = model.Name,
            ManOfTheMatch = isAdmin ? model.ManOfTheMatch : Guid.Empty,
        }.AddAuditProperties(model);
    }

    public GameTeam Adapt(GameTeamDto dto)
    {
        return new GameTeam
        {
            Id = dto.Id,
            Name = dto.Name,
            ManOfTheMatch = dto.ManOfTheMatch,
        }.AddAuditProperties(dto);
    }
}