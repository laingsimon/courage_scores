using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class AddOrUpdateTournamentGameCommand : AddOrUpdateCommand<TournamentGame, EditTournamentGameDto>
{
    private static readonly GameMatchOption DefaultMatchOptions = new GameMatchOption
    {
        StartingScore = 501,
        NumberOfLegs = 3,
    };

    private readonly ISeasonService _seasonService;
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;
    private readonly IAdapter<TournamentRound, TournamentRoundDto> _tournamentRoundAdapter;
    private readonly IAuditingHelper _auditingHelper;
    private readonly ISystemClock _systemClock;
    private readonly IUserService _userService;
    private readonly ScopedCacheManagementFlags _cacheFlags;
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygService;
    private readonly ICommandFactory _commandFactory;

    public AddOrUpdateTournamentGameCommand(
        ISeasonService seasonService,
        IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter,
        IAdapter<TournamentRound, TournamentRoundDto> tournamentRoundAdapter,
        IAuditingHelper auditingHelper,
        ISystemClock systemClock,
        IUserService userService,
        ScopedCacheManagementFlags cacheFlags,
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService,
        ICommandFactory commandFactory)
    {
        _seasonService = seasonService;
        _tournamentSideAdapter = tournamentSideAdapter;
        _tournamentRoundAdapter = tournamentRoundAdapter;
        _auditingHelper = auditingHelper;
        _systemClock = systemClock;
        _userService = userService;
        _cacheFlags = cacheFlags;
        _saygService = saygService;
        _commandFactory = commandFactory;
    }

    protected override async Task<CommandResult> ApplyUpdates(TournamentGame game, EditTournamentGameDto update, CancellationToken token)
    {
        var latestSeason = await _seasonService.GetForDate(update.Date, token);

        if (latestSeason == null)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Unable to add or update game, no season exists",
            };
        }

        var divisionIdToEvictFromCache = GetDivisionIdToEvictFromCache(game, update);

        var user = (await _userService.GetUser(token))!;
        game.Address = update.Address;
        game.Date = update.Date;
        game.SeasonId = latestSeason.Id;
        game.Notes = update.Notes;
        game.Type = update.Type;
        game.AccoladesCount = update.AccoladesCount;
        game.DivisionId = update.DivisionId;
        game.Sides = await update.Sides.SelectAsync(s => _tournamentSideAdapter.Adapt(s, token)).ToList();
        game.Round = update.Round != null ? await _tournamentRoundAdapter.Adapt(update.Round, token) : null;
        game.OneEighties = update.OneEighties.Select(p => AdaptToPlayer(p, user)).ToList();
        game.Over100Checkouts = update.Over100Checkouts.Select(p => AdaptToHiCheckPlayer(p, user)).ToList();

        foreach (var side in game.Sides)
        {
            await UpdateSide(side, token);
        }

        await UpdateRoundRecursively(game.Round, game.Sides, token);

        _cacheFlags.EvictDivisionDataCacheForSeasonId = game.SeasonId;
        _cacheFlags.EvictDivisionDataCacheForDivisionId = divisionIdToEvictFromCache;
        return CommandResult.SuccessNoMessage;
    }

    private async Task UpdateRoundRecursively(TournamentRound? round, IReadOnlyCollection<TournamentSide> sides, CancellationToken token)
    {
        if (round == null)
        {
            return;
        }

        foreach (var side in round.Sides.Where(s => s.Id == default))
        {
            await UpdateSideAndLinkToRootSide(side, sides, token);
        }

        await UpdateRound(round, token);

        // ReSharper disable once TailRecursiveCall
        await UpdateRoundRecursively(round.NextRound, sides, token);
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

    private async Task UpdateRound(TournamentRound round, CancellationToken token)
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
            await UpdateMatch(match, matchOptions, token);
            index++;
        }
    }

    private async Task UpdateMatch(TournamentMatch match, GameMatchOption? matchOptions, CancellationToken token)
    {
        if (match.Id == default)
        {
            match.Id = Guid.NewGuid();
        }

        if (match.SaygId != null)
        {
            if (!await UpdateMatchSayg(match.SaygId.Value, match, matchOptions, token))
            {
                // sayg no longer valid - should remove it
                match.SaygId = null;
            }
        }

        await _auditingHelper.SetUpdated(match, token);
    }

    private async Task<bool> UpdateMatchSayg(Guid saygId, TournamentMatch match, GameMatchOption? matchOptions, CancellationToken token)
    {
        var sayg = await _saygService.Get(saygId, token);
        if (sayg == null)
        {
            // sayg not found... should remove the id as it's no longer valid
            return false;
        }

        var command = _commandFactory.GetCommand<AddOrUpdateSaygCommand>().WithData(GetUpdate(sayg, match, matchOptions ?? DefaultMatchOptions));
        var result = await _saygService.Upsert(saygId, command, token);

        if (result.Success)
        {
            return true;
        }

        // TODO: something went wrong, report this back
        return true;
    }

    private static UpdateRecordedScoreAsYouGoDto GetUpdate(RecordedScoreAsYouGoDto sayg, TournamentMatch match, GameMatchOption matchOptions)
    {
        return new UpdateRecordedScoreAsYouGoDto
        {
            OpponentName = GetSideName(match.SideB),
            YourName = GetSideName(match.SideA),
            NumberOfLegs = matchOptions.NumberOfLegs ?? sayg.NumberOfLegs,
            StartingScore = matchOptions.StartingScore ?? sayg.StartingScore,
            LastUpdated = sayg.Updated,
            TournamentMatchId = match.Id,
            Legs = sayg.Legs,
            Id = sayg.Id,
            AwayScore = sayg.AwayScore,
            HomeScore = sayg.HomeScore,
        };
    }

    private static string GetSideName(TournamentSide side)
    {
        if (!string.IsNullOrEmpty(side.Name))
        {
            return side.Name;
        }

        if (side.TeamId != null)
        {
            // TODO: get team name
            return side.TeamId.ToString()!;
        }

        return side.Id.ToString();
    }

    // ReSharper disable once ParameterTypeCanBeEnumerable.Local
    private async Task UpdatePlayers(IReadOnlyCollection<TournamentPlayer> players, CancellationToken token)
    {
        foreach (var player in players)
        {
            await _auditingHelper.SetUpdated(player, token);
        }
    }

    private TournamentPlayer AdaptToPlayer(EditTournamentGameDto.RecordTournamentScoresPlayerDto player, UserDto user)
    {
        return new TournamentPlayer
        {
            Id = player.Id,
            Name = player.Name,
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Editor = user.Name,
            Updated = _systemClock.UtcNow.UtcDateTime,
            DivisionId = player.DivisionId,
        };
    }

    private NotableTournamentPlayer AdaptToHiCheckPlayer(EditTournamentGameDto.TournamentOver100CheckoutDto player, UserDto user)
    {
        return new NotableTournamentPlayer
        {
            Id = player.Id,
            Name = player.Name,
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Editor = user.Name,
            Updated = _systemClock.UtcNow.UtcDateTime,
            Notes = player.Notes,
            DivisionId = player.DivisionId,
        };
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