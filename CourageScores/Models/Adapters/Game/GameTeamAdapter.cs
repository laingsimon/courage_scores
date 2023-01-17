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

    public async Task<GameTeamDto> Adapt(GameTeam model, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var access = user?.Access;
        var isAdmin = access?.ManageScores == true;
        var isAbleToInputForThisTeam = access?.InputResults == true && user?.TeamId == model.Id;

        return new GameTeamDto
        {
            Id = model.Id,
            Name = model.Name,
            ManOfTheMatch = model.ManOfTheMatch == null
                ? null
                : isAdmin || isAbleToInputForThisTeam
                    ? model.ManOfTheMatch
                    : Guid.Empty,
        }.AddAuditProperties(model);
    }

    public Task<GameTeam> Adapt(GameTeamDto dto, CancellationToken token)
    {
        return Task.FromResult(new GameTeam
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
            ManOfTheMatch = dto.ManOfTheMatch,
        }.AddAuditProperties(dto));
    }
}