using CourageScores.Models;
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

    public async Task<ActionResult<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        if (_patch == null)
        {
            throw new InvalidOperationException("WithPatch must be called first");
        }

        var updates = new List<IActionResult<object>>();
        if (_patch.Round != null)
        {
            updates.Add(await PatchRound(model.Round, _patch.Round));
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
            return new ActionResult<TournamentGame>
            {
                Success = updates.All(u => u.Success),
                Errors = updates.SelectMany(u => u.Errors).ToList(),
                Warnings = updates.SelectMany(u => u.Warnings).ToList(),
                Messages = updates.SelectMany(u => u.Messages).ToList(),
                Result = model,
            };
        }

        return new ActionResult<TournamentGame>
        {
            Success = false,
            Messages = { "No tournament data to update" },
            Result = model,
        };
    }

    private async Task<ActionResult<TournamentGame>> Patch180(TournamentGame model, TournamentPlayerDto oneEighty, CancellationToken token)
    {
        model.OneEighties.Add(await _oneEightyPlayerAdapter.Adapt(oneEighty, token));
        return new ActionResult<TournamentGame>
        {
            Success = true,
            Messages = { "180 added" },
            Result = model,
        };
    }

    private async Task<ActionResult<TournamentGame>> PatchHiCheck(TournamentGame model, NotableTournamentPlayerDto hiCheck, CancellationToken token)
    {
        model.Over100Checkouts.Add(await _hiCheckPlayerAdapter.Adapt(hiCheck, token));
        return new ActionResult<TournamentGame>
        {
            Success = true,
            Messages = { "hi-check added" },
            Result = model,
        };
    }

    private async Task<ActionResult<TournamentRound>> PatchRound(TournamentRound? currentRound, PatchTournamentRoundDto patchRound)
    {
        if (currentRound == null)
        {
            return new ActionResult<TournamentRound>
            {
                Success = false,
                Messages = { "Round doesn't exist" },
            };
        }

        var updates = new List<IActionResult<object>>();
        if (patchRound.NextRound != null)
        {
            updates.Add(await PatchRound(currentRound.NextRound, patchRound.NextRound));
        }

        if (patchRound.Match != null)
        {
            updates.Add(PatchMatch(currentRound.Matches, patchRound.Match));
        }

        if (updates.Any())
        {
            return new ActionResult<TournamentRound>
            {
                Success = updates.All(u => u.Success),
                Errors = updates.SelectMany(u => u.Errors).ToList(),
                Warnings = updates.SelectMany(u => u.Warnings).ToList(),
                Messages = updates.SelectMany(u => u.Messages).ToList(),
                Result = currentRound,
            };
        }

        return new ActionResult<TournamentRound>
        {
            Success = false,
            Messages = { "No round details to update" },
            Result = currentRound,
        };
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
                Messages = { "Match not found" },
            };
        }

        if (patchMatch.ScoreA == null && patchMatch.ScoreB == null)
        {
            return new ActionResult<TournamentMatch>
            {
                Success = false,
                Messages = { "No match details to update" },
            };
        }

        match.ScoreA = patchMatch.ScoreA ?? match.ScoreA;
        match.ScoreB = patchMatch.ScoreB ?? match.ScoreB;
        return new ActionResult<TournamentMatch>
        {
            Success = true,
            Messages = { "Match updated" },
            Result = match,
        };
    }
}