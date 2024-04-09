using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class NotableTournamentPlayerAdapter : IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto>
{
    public Task<NotableTournamentPlayerDto> Adapt(NotableTournamentPlayer model, CancellationToken token)
    {
        var hasIntegerScore = int.TryParse(model.Notes, out var integerScore);

        return Task.FromResult(new NotableTournamentPlayerDto
        {
            Id = model.Id,
            Name = model.Name,
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = model.Notes,
#pragma warning restore CS0618 // Type or member is obsolete
            Score = hasIntegerScore ? integerScore : null,
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model));
    }

    public Task<NotableTournamentPlayer> Adapt(NotableTournamentPlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new NotableTournamentPlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = dto.Score?.ToString() ?? dto.Notes?.Trim(),
#pragma warning restore CS0618 // Type or member is obsolete
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto));
    }
}