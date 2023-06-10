using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Services.Command;

public class PatchTournamentCommand : IUpdateCommand<TournamentGame, TournamentGame>
{
    private readonly ISimpleAdapter<TournamentPlayer, TournamentPlayerDto> _oneEightyPlayerAdapter;
    private readonly ISimpleAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto> _hiCheckPlayerAdapter;
    private PatchTournamentDto? _patch;

    public PatchTournamentCommand(
        ISimpleAdapter<TournamentPlayer, TournamentPlayerDto> oneEightyPlayerAdapter,
        ISimpleAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto> hiCheckPlayerAdapter)
    {
        _oneEightyPlayerAdapter = oneEightyPlayerAdapter;
        _hiCheckPlayerAdapter = hiCheckPlayerAdapter;
    }

    public PatchTournamentCommand WithPatch(PatchTournamentDto patch)
    {
        _patch = patch;
        return this;
    }

    public async Task<CommandOutcome<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        if (_patch == null)
        {
            throw new InvalidOperationException("WithPatch must be called first");
        }

        var updates = new List<ICommandOutcome<object>>();
        if (_patch.Round != null)
        {
            updates.Add(await PatchRound(model.Round, _patch.Round, token));
        }

        if (_patch.Additional180 != null)
        {
            updates.Add(await Patch180(model, _patch.Additional180, token));
        }

        if (_patch.AdditionalOver100Checkout != null)
        {
            updates.Add(await PatchHiCheck(model, _patch.AdditionalOver100Checkout, token));
        }

        if (updates.Any())
        {
            return new CommandOutcome<TournamentGame>(
                updates.All(u => u.Success),
                string.Join(", ", updates.Select(u => u.Message)),
                model);
        }

        return new CommandOutcome<TournamentGame>(
            false,
            "No tournament data to update",
            model);
    }

    private async Task<ICommandOutcome<TournamentGame>> Patch180(TournamentGame model, TournamentPlayerDto oneEighty, CancellationToken token)
    {
        model.OneEighties.Add(await _oneEightyPlayerAdapter.Adapt(oneEighty, token));
        return new CommandOutcome<TournamentGame>(true, "180 added", model);
    }

    private async Task<ICommandOutcome<TournamentGame>> PatchHiCheck(TournamentGame model, NotableTournamentPlayerDto hiCheck, CancellationToken token)
    {
        model.Over100Checkouts.Add(await _hiCheckPlayerAdapter.Adapt(hiCheck, token));
        return new CommandOutcome<TournamentGame>(true, "hi-check added", model);
    }

    private async Task<CommandOutcome<TournamentRound>> PatchRound(TournamentRound? currentRound, PatchTournamentRoundDto patchRound, CancellationToken token)
    {
        if (currentRound == null)
        {
            return new CommandOutcome<TournamentRound>(false, "Round doesn't exist", null);
        }

        var updates = new List<ICommandOutcome<object>>();
        if (patchRound.NextRound != null)
        {
            updates.Add(await PatchRound(currentRound.NextRound, patchRound.NextRound, token));
        }

        if (patchRound.Match != null)
        {
            updates.Add(PatchMatch(currentRound.Matches, patchRound.Match));
        }

        if (updates.Any())
        {
            return new CommandOutcome<TournamentRound>(
                updates.All(u => u.Success),
                string.Join(", ", updates.Select(u => u.Message)),
                currentRound);
        }

        return new CommandOutcome<TournamentRound>(
            false,
            "No round details to update",
            currentRound);
    }

    private static ICommandOutcome<TournamentMatch> PatchMatch(IReadOnlyCollection<TournamentMatch> matches, PatchTournamentMatchDto patchMatch)
    {
        var match = matches
            .SingleOrDefault(m => m.SideA.Id == patchMatch.SideA && m.SideB.Id == patchMatch.SideB);

        if (match == null)
        {
            return new CommandOutcome<TournamentMatch>(false, "Match not found", null);
        }

        if (patchMatch.ScoreA == null && patchMatch.ScoreB == null)
        {
            return new CommandOutcome<TournamentMatch>(false, "No match details to update", null);
        }

        match.ScoreA = patchMatch.ScoreA ?? match.ScoreA;
        match.ScoreB = patchMatch.ScoreB ?? match.ScoreB;
        return new CommandOutcome<TournamentMatch>(true, "Match updated", match);
    }
}