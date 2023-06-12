using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Services.Command;

public class PatchTournamentCommand : IUpdateCommand<TournamentGame, TournamentGame>
{
    private readonly IAdapter<TournamentPlayer, TournamentPlayerDto> _oneEightyPlayerAdapter;
    private readonly IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto> _hiCheckPlayerAdapter;
    private PatchTournamentDto? _patch;

    public PatchTournamentCommand(
        IAdapter<TournamentPlayer, TournamentPlayerDto> oneEightyPlayerAdapter,
        IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto> hiCheckPlayerAdapter)
    {
        _oneEightyPlayerAdapter = oneEightyPlayerAdapter;
        _hiCheckPlayerAdapter = hiCheckPlayerAdapter;
    }

    public PatchTournamentCommand WithPatch(PatchTournamentDto patch)
    {
        _patch = patch;
        return this;
    }

    public async Task<CommandResult<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        if (_patch == null)
        {
            throw new InvalidOperationException("WithPatch must be called first");
        }

        var updates = new List<ICommandResult<object>>();
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
            return new CommandResult<TournamentGame>
            {
                Success = updates.All(u => u.Success),
                Message = string.Join(", ", updates.Select(u => u.Message)),
                Result = model,
            };
        }

        return new CommandResult<TournamentGame>
        {
            Success = false,
            Message = "No tournament data to update",
            Result = model,
        };
    }

    private async Task<CommandResult<TournamentGame>> Patch180(TournamentGame model, TournamentPlayerDto oneEighty, CancellationToken token)
    {
        model.OneEighties.Add(await _oneEightyPlayerAdapter.Adapt(oneEighty, token));
        return new CommandResult<TournamentGame>
        {
            Success = true,
            Message = "180 added",
            Result = model,
        };
    }

    private async Task<CommandResult<TournamentGame>> PatchHiCheck(TournamentGame model, NotableTournamentPlayerDto hiCheck, CancellationToken token)
    {
        model.Over100Checkouts.Add(await _hiCheckPlayerAdapter.Adapt(hiCheck, token));
        return new CommandResult<TournamentGame>
        {
            Success = true,
            Message = "hi-check added",
            Result = model,
        };
    }

    private async Task<CommandResult<TournamentRound>> PatchRound(TournamentRound? currentRound, PatchTournamentRoundDto patchRound, CancellationToken token)
    {
        if (currentRound == null)
        {
            return new CommandResult<TournamentRound>
            {
                Success = false,
                Message = "Round doesn't exist",
            };
        }

        var updates = new List<ICommandResult<object>>();
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
            return new CommandResult<TournamentRound>
            {
                Success = updates.All(u => u.Success),
                Message = string.Join(", ", updates.Select(u => u.Message)),
                Result = currentRound,
            };
        }

        return new CommandResult<TournamentRound>
        {
            Success = false,
            Message = "No round details to update",
            Result = currentRound,
        };
    }

    private static CommandResult<TournamentMatch> PatchMatch(IReadOnlyCollection<TournamentMatch> matches, PatchTournamentMatchDto patchMatch)
    {
        var match = matches
            .SingleOrDefault(m => m.SideA.Id == patchMatch.SideA && m.SideB.Id == patchMatch.SideB);

        if (match == null)
        {
            return new CommandResult<TournamentMatch>
            {
                Success = false,
                Message = "Match not found",
            };
        }

        if (patchMatch.ScoreA == null && patchMatch.ScoreB == null)
        {
            return new CommandResult<TournamentMatch>
            {
                Success = false,
                Message = "No match details to update",
            };
        }

        match.ScoreA = patchMatch.ScoreA ?? match.ScoreA;
        match.ScoreB = patchMatch.ScoreB ?? match.ScoreB;
        return new CommandResult<TournamentMatch>
        {
            Success = true,
            Message = "Match updated",
            Result = match,
        };
    }
}