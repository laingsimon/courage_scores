using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class NotablePlayerAdapter : IAdapter<NotablePlayer, NotablePlayerDto>
{
    public Task<NotablePlayerDto> Adapt(NotablePlayer model, CancellationToken token)
    {
        var hasIntegerScore = int.TryParse(model.Notes, out var integerScore);

        return Task.FromResult(new NotablePlayerDto
        {
            Id = model.Id,
            Name = model.Name,
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = model.Notes,
#pragma warning restore CS0618 // Type or member is obsolete
            Score = hasIntegerScore ? integerScore : null,
        }.AddAuditProperties(model));
    }

    public Task<NotablePlayer> Adapt(NotablePlayerDto dto, CancellationToken token)
    {
        return Task.FromResult(new NotablePlayer
        {
            Id = dto.Id,
            Name = dto.Name.Trim(),
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = dto.Score?.ToString() ?? dto.Notes?.Trim(),
#pragma warning restore CS0618 // Type or member is obsolete
        }.AddAuditProperties(dto));
    }
}