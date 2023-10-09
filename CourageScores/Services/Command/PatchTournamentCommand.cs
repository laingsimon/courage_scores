using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Services.Command;

public class PatchTournamentCommand : IUpdateCommand<TournamentGame, TournamentGame>
{
    private readonly IAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto> _hiCheckPlayerAdapter;
    private readonly IAdapter<TournamentPlayer, TournamentPlayerDto> _oneEightyPlayerAdapter;
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

    public async Task<ActionResult<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        _patch.ThrowIfNull($"{nameof(WithPatch)} must be called first");

        var updates = new ActionResult<object>
        {
            Success = true,
        };
        var updatesApplied = false;
        if (_patch!.Round != null)
        {
            updates = updates.Merge(await PatchRound(model.Round, _patch.Round));
            updatesApplied = true;
        }

        if (_patch.Additional180 != null)
        {
            updates = updates.Merge(await Patch180(model, _patch.Additional180, token));
            updatesApplied = true;
        }

        if (_patch.AdditionalOver100Checkout != null)
        {
            updates = updates.Merge(await PatchHiCheck(model, _patch.AdditionalOver100Checkout, token));
            updatesApplied = true;
        }

        if (!updatesApplied)
        {
            updates = updates.Merge(new ActionResult<object>
            {
                Success = false,
                Warnings =
                {
                    "No tournament data to update",
                },
            });
        }

        return updates.As(model);
    }

    private async Task<ActionResult<TournamentGame>> Patch180(TournamentGame model, TournamentPlayerDto oneEighty, CancellationToken token)
    {
        model.OneEighties.Add(await _oneEightyPlayerAdapter.Adapt(oneEighty, token));
        return new ActionResult<TournamentGame>
        {
            Success = true,
            Messages =
            {
                "180 added",
            },
            Result = model,
        };
    }

    private async Task<ActionResult<TournamentGame>> PatchHiCheck(TournamentGame model, NotableTournamentPlayerDto hiCheck, CancellationToken token)
    {
        model.Over100Checkouts.Add(await _hiCheckPlayerAdapter.Adapt(hiCheck, token));
        return new ActionResult<TournamentGame>
        {
            Success = true,
            Messages =
            {
                "hi-check added",
            },
            Result = model,
        };
    }

    private static async Task<ActionResult<TournamentRound>> PatchRound(TournamentRound? currentRound, PatchTournamentRoundDto patchRound)
    {
        if (currentRound == null)
        {
            return new ActionResult<TournamentRound>
            {
                Success = false,
                Errors =
                {
                    "Round doesn't exist",
                },
            };
        }

        var updates = new ActionResult<object>
        {
            Success = true,
        };
        var updatesApplied = false;
        if (patchRound.NextRound != null)
        {
            updates = updates.Merge(await PatchRound(currentRound.NextRound, patchRound.NextRound));
            updatesApplied = true;
        }

        if (patchRound.Match != null)
        {
            updates = updates.Merge(PatchMatch(currentRound.Matches, patchRound.Match));
            updatesApplied = true;
        }

        if (!updatesApplied)
        {
            updates = updates.Merge(new ActionResult<object>
            {
                Success = false,
                Warnings =
                {
                    "No round details to update",
                },
            });
        }

        return updates.As(currentRound);
    }

    private static ActionResult<TournamentMatch> PatchMatch(IReadOnlyCollection<TournamentMatch> matches, PatchTournamentMatchDto patchMatch)
    {
        var match = matches
            .SingleOrDefault(m => m.SideA.Id == patchMatch.SideA && m.SideB.Id == patchMatch.SideB);

        if (match == null)
        {
            return new ActionResult<TournamentMatch>
            {
                Success = false,
                Errors =
                {
                    "Match not found",
                },
            };
        }

        if (patchMatch.ScoreA == null && patchMatch.ScoreB == null)
        {
            return new ActionResult<TournamentMatch>
            {
                Success = false,
                Warnings =
                {
                    "No match details to update",
                },
            };
        }

        match.ScoreA = patchMatch.ScoreA ?? match.ScoreA;
        match.ScoreB = patchMatch.ScoreB ?? match.ScoreB;
        return new ActionResult<TournamentMatch>
        {
            Success = true,
            Messages =
            {
                "Match updated",
            },
            Result = match,
        };
    }
}