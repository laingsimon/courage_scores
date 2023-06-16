using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Models.Adapters.Game;

public class NotableTournamentPlayerAdapter : INotableTournamentPlayerAdapter
{
    private readonly ISystemClock _systemClock;
    private readonly IUserService _userService;

    public NotableTournamentPlayerAdapter(ISystemClock systemClock, IUserService userService)
    {
        _systemClock = systemClock;
        _userService = userService;
    }

    public Task<NotableTournamentPlayerDto> Adapt(NotableTournamentPlayer model, CancellationToken token)
    {
        return Task.FromResult(new NotableTournamentPlayerDto
        {
            Id = model.Id,
            Name = model.Name,
            Notes = model.Notes,
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model));
    }

    public Task<NotableTournamentPlayer> Adapt(NotableTournamentPlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new NotableTournamentPlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
            Notes = dto.Notes?.Trim(),
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto));
    }

    public async Task<NotableTournamentPlayer> Adapt(EditTournamentGameDto.TournamentOver100CheckoutDto player, CancellationToken token)
    {
        var user = (await _userService.GetUser(token))!;

        return new NotableTournamentPlayer
        {
            Id = player.Id,
            Name = player.Name.Trim(),
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Editor = user.Name,
            Updated = _systemClock.UtcNow.UtcDateTime,
            Notes = player.Notes?.Trim(),
            DivisionId = player.DivisionId,
        };
    }
}