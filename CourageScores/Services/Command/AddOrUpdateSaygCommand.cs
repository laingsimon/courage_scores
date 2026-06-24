using System.Diagnostics.CodeAnalysis;
using CourageScores.Common;
using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Command;

public class AddOrUpdateSaygCommand : AddOrUpdateCommand<RecordedScoreAsYouGo, UpdateRecordedScoreAsYouGoDto>
{
    private readonly ISimpleAdapter<Leg, LegDto> _legAdapter;
    private readonly IUserService _userService;
    private readonly IAccessService _accessService;

    public AddOrUpdateSaygCommand(ISimpleAdapter<Leg, LegDto> legAdapter, IUserService userService, IAccessService accessService)
    {
        _legAdapter = legAdapter;
        _userService = userService;
        _accessService = accessService;
    }

    [ExcludeFromCodeCoverage]
    public override bool RequiresLogin => false;

    protected override async Task<ActionResult<RecordedScoreAsYouGo>> ApplyUpdates(RecordedScoreAsYouGo model, UpdateRecordedScoreAsYouGoDto update, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if ((model.TournamentMatchId ?? update.TournamentMatchId) != null && !await _accessService.HasAccess(user, AccessOption.RecordScoresAsYouGo, token))
        {
            return new ActionResult<RecordedScoreAsYouGo>
            {
                Success = false,
                Errors =
                {
                    "Not permitted to modify tournament sayg sessions",
                },
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
            return new ActionResult<RecordedScoreAsYouGo>
            {
                Success = false,
                Warnings =
                {
                    update.TournamentMatchId != null
                        ? "Sayg session ids cannot be changed"
                        : "Sayg session ids cannot be removed",
                },
            };
        }

        model.Legs = await update.Legs.ToDictionaryAsync(key => key, value => _legAdapter.Adapt(value, token));
        model.HomeScore = update.HomeScore;
        model.AwayScore = update.AwayScore;
        model.YourName = update.YourName.TrimOrDefault();
        model.OpponentName = update.OpponentName?.Trim();
        model.StartingScore = update.StartingScore;
        model.NumberOfLegs = update.NumberOfLegs;

        return new ActionResult<RecordedScoreAsYouGo>
        {
            Success = true,
            Messages =
            {
                "Sayg data updated",
            },
        };
    }
}
