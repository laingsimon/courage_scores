using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class AddOrUpdateSaygCommand : AddOrUpdateCommand<RecordedScoreAsYouGo, UpdateRecordedScoreAsYouGoDto>
{
    private readonly ISimpleAdapter<Leg, LegDto> _legAdapter;
    private readonly IUserService _userService;

    public AddOrUpdateSaygCommand(ISimpleAdapter<Leg, LegDto> legAdapter, IUserService userService)
    {
        _legAdapter = legAdapter;
        _userService = userService;
    }

    protected override async Task<CommandResult> ApplyUpdates(RecordedScoreAsYouGo model, UpdateRecordedScoreAsYouGoDto update, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if ((model.TournamentMatchId ?? update.TournamentMatchId) != null && user?.Access?.RecordScoresAsYouGo != true)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Not permitted to modify tournament sayg sessions",
            };
        }

        if (model.TournamentMatchId == null && update.TournamentMatchId != null)
        {
            // add TournamentMatchId
            model.TournamentMatchId = update.TournamentMatchId;
        }
        else if (model.TournamentMatchId != null && model.TournamentMatchId != update.TournamentMatchId)
        {
            // cannot change/remove TournamentMatchId
            return new CommandResult
            {
                Success = false,
                Message = update.TournamentMatchId != null
                    ? "Sayg session ids cannot be changed"
                    : "Sayg session ids cannot be removed",
            };
        }

        model.Legs = await update.Legs.ToDictionaryAsync(key => key, value => _legAdapter.Adapt(value, token));
        model.HomeScore = update.HomeScore;
        model.AwayScore = update.AwayScore;
        model.YourName = update.YourName;
        model.OpponentName = update.OpponentName;
        model.StartingScore = update.StartingScore;
        model.NumberOfLegs = update.NumberOfLegs;

        return CommandResult.SuccessNoMessage;
    }

    [ExcludeFromCodeCoverage]
    public override bool RequiresLogin => false;
}