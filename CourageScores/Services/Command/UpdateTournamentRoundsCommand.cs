using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Services.Command;

public class UpdateTournamentRoundsCommand : IUpdateCommand<TournamentGame, TournamentGame>
{
    private readonly IAdapter<TournamentSide, TournamentSideDto> _sideAdapter;
    private readonly IAdapter<TournamentMatch, TournamentMatchDto> _matchAdapter;
    private TournamentRoundDto? _rounds;

    public UpdateTournamentRoundsCommand(
        IAdapter<TournamentSide, TournamentSideDto> sideAdapter,
        IAdapter<TournamentMatch, TournamentMatchDto> matchAdapter)
    {
        _sideAdapter = sideAdapter;
        _matchAdapter = matchAdapter;
    }

    public UpdateTournamentRoundsCommand WithData(TournamentRoundDto rounds)
    {
        _rounds = rounds;
        return this;
    }

    public async Task<CommandOutcome<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        if (_rounds == null)
        {
            throw new InvalidOperationException($"Data hasn't been set, ensure {nameof(WithData)} is called");
        }

        model.Round = await UpdateRound(model.Round, _rounds, token);

        return new CommandOutcome<TournamentGame>(true, "Tournament game updated", model);
    }

    private async Task<TournamentRound?> UpdateRound(TournamentRound? currentRound, TournamentRoundDto? update, CancellationToken token)
    {
        if (update == null)
        {
            return null;
        }

        currentRound ??= new TournamentRound();

        currentRound.Name = update.Name;
        currentRound.Matches = await update.Matches.SelectAsync(m => _matchAdapter.Adapt(m, token)).ToList();
        currentRound.Sides = await update.Sides.SelectAsync(s => _sideAdapter.Adapt(s, token)).ToList();
        currentRound.NextRound = await UpdateRound(currentRound.NextRound, update.NextRound, token);

        return currentRound;
    }
}