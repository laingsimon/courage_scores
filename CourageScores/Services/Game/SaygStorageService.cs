using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Repository;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Game;

public class SaygStorageService : ISaygStorageService
{
    private readonly ISimpleAdapter<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _adapter;
    private readonly IGenericRepository<RecordedScoreAsYouGo> _repository;
    private readonly ISystemClock _clock;

    public SaygStorageService(
        ISimpleAdapter<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> adapter,
        IGenericRepository<RecordedScoreAsYouGo> repository,
        ISystemClock clock)
    {
        _adapter = adapter;
        _repository = repository;
        _clock = clock;
    }

    public async Task<ActionResultDto<RecordedScoreAsYouGoDto>> UpsertData(RecordedScoreAsYouGoDto dto, CancellationToken token)
    {
        var data = await _adapter.Adapt(dto, token);
        if (data.Id == Guid.Empty)
        {
            data.Id = Guid.NewGuid();
        }

        // TODO: #334: Check the existing SAYG update, reject if different

        var result = await _repository.Upsert(data, token);

        return new ActionResultDto<RecordedScoreAsYouGoDto>
        {
            Success = true,
            Result = await _adapter.Adapt(result, token),
        };
    }

    public async Task<RecordedScoreAsYouGoDto?> Get(Guid id, CancellationToken token)
    {
        var data = await _repository.Get(id, token);
        return data != null && data.Deleted == null
            ? await _adapter.Adapt(data, token)
            : null;
    }

    public async Task<ActionResultDto<RecordedScoreAsYouGoDto?>> Delete(Guid id, CancellationToken token)
    {
        var data = await _repository.Get(id, token);
        if (data == null)
        {
            return new ActionResultDto<RecordedScoreAsYouGoDto?>
            {
                Success = false,
                Errors =
                {
                    "Data not found"
                }
            };
        }

        if (data.Deleted != null)
        {
            return new ActionResultDto<RecordedScoreAsYouGoDto?>
            {
                Result = await _adapter.Adapt(data, token),
                Success = false,
                Errors =
                {
                    "Data already deleted"
                },
            };
        }

        data.Deleted = _clock.UtcNow.UtcDateTime;
        await _repository.Upsert(data, token);

        return new ActionResultDto<RecordedScoreAsYouGoDto?>
        {
            Result = await _adapter.Adapt(data, token),
            Success = true,
            Messages =
            {
                "Data deleted"
            }
        };
    }
}