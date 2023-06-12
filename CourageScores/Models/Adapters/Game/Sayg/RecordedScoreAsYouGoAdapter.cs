using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game.Sayg;

public class RecordedScoreAsYouGoAdapter : IAdapter<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>
{
    private readonly ISimpleAdapter<Leg, LegDto> _legAdapter;

    public RecordedScoreAsYouGoAdapter(ISimpleAdapter<Leg, LegDto> legAdapter)
    {
        _legAdapter = legAdapter;
    }

    public async Task<RecordedScoreAsYouGoDto> Adapt(RecordedScoreAsYouGo model, CancellationToken token)
    {
        return new RecordedScoreAsYouGoDto
        {
            Legs = await model.Legs.ToDictionaryAsync(key => key, value => _legAdapter.Adapt(value, token)),
            Id = model.Id,
            Deleted = model.Deleted,
            HomeScore = model.HomeScore,
            AwayScore = model.AwayScore,
            YourName = model.YourName,
            OpponentName = model.OpponentName,
            NumberOfLegs = model.NumberOfLegs,
            StartingScore = model.StartingScore,
            TournamentMatchId = model.TournamentMatchId,
        }.AddAuditProperties(model);
    }

    public async Task<RecordedScoreAsYouGo> Adapt(RecordedScoreAsYouGoDto dto, CancellationToken token)
    {
        return new RecordedScoreAsYouGo
        {
            Legs = await dto.Legs.ToDictionaryAsync(key => key, value => _legAdapter.Adapt(value, token)),
            Id = dto.Id,
            Deleted = dto.Deleted,
            HomeScore = dto.HomeScore,
            AwayScore = dto.AwayScore,
            YourName = dto.YourName,
            OpponentName = dto.OpponentName,
            NumberOfLegs = dto.NumberOfLegs,
            StartingScore = dto.StartingScore,
            TournamentMatchId = dto.TournamentMatchId,
        }.AddAuditProperties(dto);
    }
}