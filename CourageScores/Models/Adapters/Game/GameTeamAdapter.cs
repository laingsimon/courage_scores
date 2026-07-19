using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Game;

public class GameTeamAdapter : IAdapter<GameTeam, GameTeamDto>
{
    private readonly IUserService _userService;
    private readonly IAccessService _accessService;

    public GameTeamAdapter(IUserService userService, IAccessService accessService)
    {
        _userService = userService;
        _accessService = accessService;
    }

    public async Task<GameTeamDto> Adapt(GameTeam model, UserAccessContext context, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var isAdmin = await _accessService.HasAccess(user, AccessOption.ManageScores, context, token);
        var inputResults = await _accessService.HasAccess(user, AccessOption.InputResults, context, token);
        var isAbleToInputForThisTeam = inputResults && user?.TeamId == model.Id;

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

    public Task<GameTeam> Adapt(GameTeamDto dto, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new GameTeam
        {
            Id = dto.Id,
            Name = dto.Name.TrimOrDefault(),
            ManOfTheMatch = dto.ManOfTheMatch,
        }.AddAuditProperties(dto));
    }
}
