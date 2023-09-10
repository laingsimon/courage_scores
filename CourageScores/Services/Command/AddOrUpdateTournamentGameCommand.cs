using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Season;

namespace CourageScores.Services.Command;

public class AddOrUpdateTournamentGameCommand : AddOrUpdateCommand<TournamentGame, EditTournamentGameDto>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly ICommandFactory _commandFactory;
    private readonly INotableTournamentPlayerAdapter _notableTournamentPlayerAdapter;
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygService;
    private readonly ICachingSeasonService _seasonService;
    private readonly ITournamentPlayerAdapter _tournamentPlayerAdapter;
    private readonly IAdapter<TournamentRound, TournamentRoundDto> _tournamentRoundAdapter;
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;
    private readonly IUpdateRecordedScoreAsYouGoDtoAdapter _updateRecordedScoreAsYouGoDtoAdapter;

    public AddOrUpdateTournamentGameCommand(
        ICachingSeasonService seasonService,
        IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter,
        IAdapter<TournamentRound, TournamentRoundDto> tournamentRoundAdapter,
        IAuditingHelper auditingHelper,
        ScopedCacheManagementFlags cacheFlags,
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService,
        ICommandFactory commandFactory,
        IUpdateRecordedScoreAsYouGoDtoAdapter updateRecordedScoreAsYouGoDtoAdapter,
        ITournamentPlayerAdapter tournamentPlayerAdapter,
        INotableTournamentPlayerAdapter notableTournamentPlayerAdapter)
    {
        _seasonService = seasonService;
        _tournamentSideAdapter = tournamentSideAdapter;
        _tournamentRoundAdapter = tournamentRoundAdapter;
        _auditingHelper = auditingHelper;
        _cacheFlags = cacheFlags;
        _saygService = saygService;
        _commandFactory = commandFactory;
        _updateRecordedScoreAsYouGoDtoAdapter = updateRecordedScoreAsYouGoDtoAdapter;
        _tournamentPlayerAdapter = tournamentPlayerAdapter;
        _notableTournamentPlayerAdapter = notableTournamentPlayerAdapter;
    }

    protected override async Task<ActionResult<TournamentGame>> ApplyUpdates(TournamentGame game, EditTournamentGameDto update, CancellationToken token)
    {
        var season = await _seasonService.Get(update.SeasonId, token);

        if (season == null)
        {
            return new ActionResult<TournamentGame>
            {
                Success = false,
                Warnings =
                {
                    "Season not found",
                },
            };
        }

        var divisionIdToEvictFromCache = GetDivisionIdToEvictFromCache(game, update);
        var context = new ActionResult<TournamentGame>
        {
            Success = true,
        };

        game.Address = update.Address?.Trim() ?? "";
        game.Date = update.Date;
        game.SeasonId = season.Id;
        game.Notes = update.Notes?.Trim();
        game.Type = update.Type?.Trim();
        game.BestOf = update.BestOf;
        game.SingleRound = update.SingleRound;
        game.AccoladesCount = update.AccoladesCount;
        game.DivisionId = update.DivisionId;
        game.Host = update.Host?.Trim();
        game.Opponent = update.Opponent?.Trim();
        game.Gender = update.Gender?.Trim();
        game.Sides = await update.Sides.SelectAsync(s => _tournamentSideAdapter.Adapt(s, token)).ToList();
        game.Round = update.Round != null ? await _tournamentRoundAdapter.Adapt(update.Round, token) : null;
        game.OneEighties = await update.OneEighties.SelectAsync(p => _tournamentPlayerAdapter.Adapt(p, token)).ToList();
        game.Over100Checkouts = await update.Over100Checkouts.SelectAsync(p => _notableTournamentPlayerAdapter.Adapt(p, token)).ToList();

        foreach (var side in game.Sides)
        {
            await UpdateSide(side, token);
        }

        await UpdateRoundRecursively(game.Round, game.Sides, context, token);

        _cacheFlags.EvictDivisionDataCacheForSeasonId = game.SeasonId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = divisionIdToEvictFromCache;
        return new ActionResult<TournamentGame>
        {
            Success = context.Success,
            Errors = context.Errors,
            Warnings = context.Warnings,
            Messages = context.Messages,
        };
    }

    private async Task UpdateRoundRecursively(TournamentRound? round, IReadOnlyCollection<TournamentSide> sides, IActionResult<TournamentGame> context, CancellationToken token)
    {
        if (round == null)
        {
            return;
        }

        foreach (var side in round.Sides.Where(s => s.Id == default))
        {
            await UpdateSideAndLinkToRootSide(side, sides, token);
        }

        await UpdateRound(round, context, token);

        // ReSharper disable once TailRecursiveCall
        await UpdateRoundRecursively(round.NextRound, sides, context, token);
    }

    private async Task UpdateSide(TournamentSide side, CancellationToken token)
    {
        if (side.Id == default)
        {
            side.Id = Guid.NewGuid();
        }
        await _auditingHelper.SetUpdated(side, token);

        await UpdatePlayers(side.Players, token);
    }

    // ReSharper disable once ParameterTypeCanBeEnumerable.Local
    private async Task UpdateSideAndLinkToRootSide(TournamentSide side, IReadOnlyCollection<TournamentSide> sides, CancellationToken token)
    {
        var sideOrderedPlayers = side.Players.OrderBy(p => p.Id).Select(p => p.Id).ToArray();
        var equivalentSide = sides.SingleOrDefault(s => s.Players.OrderBy(p => p.Id).Select(p => p.Id).SequenceEqual(sideOrderedPlayers));
        if (equivalentSide != null)
        {
            side.Id = equivalentSide.Id;
        }
        await _auditingHelper.SetUpdated(side, token);

        await UpdatePlayers(side.Players, token);
    }

    private async Task UpdateRound(TournamentRound round, IActionResult<TournamentGame> context, CancellationToken token)
    {
        if (round.Id == default)
        {
            round.Id = Guid.NewGuid();
        }
        await _auditingHelper.SetUpdated(round, token);

        var index = 0;
        foreach (var match in round.Matches)
        {
            var matchOptions = round.MatchOptions.ElementAtOrDefault(index);
            await UpdateMatch(match, matchOptions, context, token);
            index++;
        }
    }

    private async Task UpdateMatch(TournamentMatch match, GameMatchOption? matchOptions, IActionResult<TournamentGame> context, CancellationToken token)
    {
        if (match.Id == default)
        {
            match.Id = Guid.NewGuid();
        }

        if (match.SaygId != null)
        {
            await UpdateMatchSayg(match.SaygId.Value, match, matchOptions, context, token);
        }

        await _auditingHelper.SetUpdated(match, token);
    }

    private async Task UpdateMatchSayg(Guid saygId, TournamentMatch match, GameMatchOption? matchOptions, IActionResult<TournamentGame> context, CancellationToken token)
    {
        var sayg = await _saygService.Get(saygId, token);
        if (sayg == null)
        {
            // sayg not found... should remove the id as it's no longer valid
            context.Warnings.Add($"Could not find sayg session for match: {match.SideA.Name} vs {match.SideB.Name}, session has been removed and will need to be re-created (was {saygId})");
            match.SaygId = null;
            return;
        }

        var command = _commandFactory.GetCommand<AddOrUpdateSaygCommand>().WithData(await _updateRecordedScoreAsYouGoDtoAdapter.Adapt(sayg, match, matchOptions, token));
        var result = await _saygService.Upsert(saygId, command, token);

        context.Errors.AddRange(result.Errors);
        context.Warnings.AddRange(result.Warnings);
        context.Messages.AddRange(result.Messages);
    }

    // ReSharper disable once ParameterTypeCanBeEnumerable.Local
    private async Task UpdatePlayers(IReadOnlyCollection<TournamentPlayer> players, CancellationToken token)
    {
        foreach (var player in players)
        {
            await _auditingHelper.SetUpdated(player, token);
        }
    }

    private static Guid GetDivisionIdToEvictFromCache(TournamentGame game, EditTournamentGameDto update)
    {
        if (game.DivisionId == update.DivisionId)
        {
            return game.DivisionId ?? ScopedCacheManagementFlags.EvictAll;
        }

        return ScopedCacheManagementFlags.EvictAll;
    }
}