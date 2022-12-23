using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Team;

public class TeamPlayerAdapter : IAdapter<TeamPlayer, TeamPlayerDto>
{
    private readonly IUserService _userService;

    public TeamPlayerAdapter(IUserService userService)
    {
        _userService = userService;
    }

    public async Task<TeamPlayerDto> Adapt(TeamPlayer model)
    {
        var canShowEmailAddress = await CanShowEmailAddress(model);

        return new TeamPlayerDto
        {
            Captain = model.Captain,
            Id = model.Id,
            Name = model.Name,
            EmailAddress = canShowEmailAddress
                ? model.EmailAddress
                : null,
        }.AddAuditProperties(model);
    }

    public Task<TeamPlayer> Adapt(TeamPlayerDto dto)
    {
        return Task.FromResult(new TeamPlayer
        {
            Captain = dto.Captain,
            Id = dto.Id,
            Name = dto.Name.Trim(),
            EmailAddress = dto.EmailAddress?.Trim(),
        }.AddAuditProperties(dto));
    }

    private async Task<bool> CanShowEmailAddress(TeamPlayer player)
    {
        var user = await _userService.GetUser();
        if (user == null)
        {
            return false;
        }

        return user.Access?.ManageAccess == true
               || user.Access?.ManageTeams == true
               || player.EmailAddress == user.EmailAddress;
    }
}