using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Command;

public class AddOrUpdateSaygCommand : AddOrUpdateCommand<RecordedScoreAsYouGo, UpdateRecordedScoreAsYouGoDto>
{
    private readonly ISimpleAdapter<Leg, LegDto> _legAdapter;

    public AddOrUpdateSaygCommand(ISimpleAdapter<Leg, LegDto> legAdapter)
    {
        _legAdapter = legAdapter;
    }

    protected override async Task<CommandResult> ApplyUpdates(RecordedScoreAsYouGo model, UpdateRecordedScoreAsYouGoDto update, CancellationToken token)
    {
        model.Legs = await update.Legs.ToDictionaryAsync(key => key, value => _legAdapter.Adapt(value, token));
        model.HomeScore = update.HomeScore;
        model.AwayScore = update.AwayScore;
        model.YourName = update.YourName;
        model.OpponentName = update.OpponentName;
        model.StartingScore = update.StartingScore;
        model.NumberOfLegs = update.NumberOfLegs;

        return CommandResult.SuccessNoMessage;
    }

    public override bool RequiresLogin => false;
}