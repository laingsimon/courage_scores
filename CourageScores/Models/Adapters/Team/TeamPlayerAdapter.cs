using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Team;

public class TeamPlayerAdapter : IAdapter<TeamPlayer, TeamPlayerDto>
{
    private readonly IUserService _userService;
    private readonly IAccessService _accessService;

    public TeamPlayerAdapter(IUserService userService, IAccessService accessService)
    {
        _userService = userService;
        _accessService = accessService;
    }

    public async Task<TeamPlayerDto> Adapt(TeamPlayer model, UserAccessContext context, CancellationToken token)
    {
        var canShowEmailAddress = await CanShowEmailAddress(model, context, token);

        return new TeamPlayerDto
        {
            Captain = model.Captain,
            Id = model.Id,
            Name = model.Name.TrimOrDefault(),
            EmailAddress = canShowEmailAddress
                ? model.EmailAddress?.Trim()
                : null,
            Gender = model.Gender.ToGenderDto(),
        }.AddAuditProperties(model);
    }

    public Task<TeamPlayer> Adapt(TeamPlayerDto dto, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new TeamPlayer
        {
            Captain = dto.Captain,
            Id = dto.Id,
            Name = dto.Name.TrimOrDefault(),
            EmailAddress = dto.EmailAddress?.Trim(),
            Gender = dto.Gender.FromGenderDto(),
        }.AddAuditProperties(dto));
    }

    private async Task<bool> CanShowEmailAddress(TeamPlayer player, UserAccessContext userAccessContext, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return false;
        }

        return await _accessService.HasAccess(user, AccessOption.ManageAccess, userAccessContext, token)
            || await _accessService.HasAccess(user, AccessOption.ManageTeams, userAccessContext, token)
            || player.EmailAddress == user.EmailAddress;
    }
}
