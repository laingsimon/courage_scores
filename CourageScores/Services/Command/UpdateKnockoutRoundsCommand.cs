using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Services.Command;

public class UpdateKnockoutRoundsCommand : IUpdateCommand<KnockoutGame, KnockoutGame>
{
    private readonly IAdapter<KnockoutSide, KnockoutSideDto> _sideAdapter;
    private readonly IAdapter<KnockoutMatch, KnockoutMatchDto> _matchAdapter;
    private KnockoutRoundDto? _rounds;

    public UpdateKnockoutRoundsCommand(
        IAdapter<KnockoutSide, KnockoutSideDto> sideAdapter,
        IAdapter<KnockoutMatch, KnockoutMatchDto> matchAdapter)
    {
        _sideAdapter = sideAdapter;
        _matchAdapter = matchAdapter;
    }

    public UpdateKnockoutRoundsCommand WithData(KnockoutRoundDto rounds)
    {
        _rounds = rounds;
        return this;
    }

    public async Task<CommandOutcome<KnockoutGame>> ApplyUpdate(KnockoutGame model, CancellationToken token)
    {
        if (_rounds == null)
        {
            throw new InvalidOperationException($"Data hasn't been set, ensure {nameof(WithData)} is called");
        }

        model.Round = await UpdateRound(model.Round, _rounds);

        return new CommandOutcome<KnockoutGame>(true, "Knockout game updated", model);
    }

    private async Task<KnockoutRound?> UpdateRound(KnockoutRound? currentRound, KnockoutRoundDto? update)
    {
        if (update == null)
        {
            return null;
        }

        currentRound ??= new KnockoutRound();

        currentRound.Name = update.Name;
        currentRound.Matches = await update.Matches.SelectAsync(m => _matchAdapter.Adapt(m)).ToList();
        currentRound.Sides = await update.Sides.SelectAsync(s => _sideAdapter.Adapt(s)).ToList();
        currentRound.NextRound = await UpdateRound(currentRound.NextRound, update.NextRound);

        return currentRound;
    }
}