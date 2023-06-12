using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Models.Adapters.Game;

public class TournamentPlayerAdapter : ITournamentPlayerAdapter
{
    private readonly ISystemClock _systemClock;
    private readonly IUserService _userService;

    public TournamentPlayerAdapter(ISystemClock systemClock, IUserService userService)
    {
        _systemClock = systemClock;
        _userService = userService;
    }

    public Task<TournamentPlayerDto> Adapt(TournamentPlayer model, CancellationToken token)
    {
        return Task.FromResult(new TournamentPlayerDto
        {
            Id = model.Id,
            Name = model.Name,
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model));
    }

    public Task<TournamentPlayer> Adapt(TournamentPlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new TournamentPlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto));
    }

    public async Task<TournamentPlayer> Adapt(EditTournamentGameDto.RecordTournamentScoresPlayerDto player, CancellationToken token)
    {
        var user = (await _userService.GetUser(token))!;

        return new TournamentPlayer
        {
            Id = player.Id,
            Name = player.Name.Trim(),
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Editor = user.Name,
            Updated = _systemClock.UtcNow.UtcDateTime,
            DivisionId = player.DivisionId,
        };
    }
}