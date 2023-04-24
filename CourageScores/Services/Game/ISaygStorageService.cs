using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Game;

public interface ISaygStorageService
{
    Task<ActionResultDto<RecordedScoreAsYouGoDto>> UpsertData(RecordedScoreAsYouGoDto data, CancellationToken token);
    Task<RecordedScoreAsYouGoDto?> Get(Guid id, CancellationToken token);
    Task<ActionResultDto<RecordedScoreAsYouGoDto?>> Delete(Guid id, CancellationToken token);
}