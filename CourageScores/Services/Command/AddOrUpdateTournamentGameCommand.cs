using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using CourageScores.Services.Season;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class AddOrUpdateTournamentGameCommand : AddOrUpdateCommand<TournamentGame, EditTournamentGameDto>
{
    private readonly ISeasonService _seasonService;
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;
    private readonly IAdapter<TournamentRound, TournamentRoundDto> _tournamentRoundAdapter;
    private readonly IAuditingHelper _auditingHelper;
    private readonly ISystemClock _systemClock;
    private readonly IUserService _userService;
    private readonly ScopedCacheManagementFlags _cacheFlags;

    public AddOrUpdateTournamentGameCommand(
        ISeasonService seasonService,
        IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter,
        IAdapter<TournamentRound, TournamentRoundDto> tournamentRoundAdapter,
        IAuditingHelper auditingHelper,
        ISystemClock systemClock,
        IUserService userService,
        ScopedCacheManagementFlags cacheFlags)
    {
        _seasonService = seasonService;
        _tournamentSideAdapter = tournamentSideAdapter;
        _tournamentRoundAdapter = tournamentRoundAdapter;
        _auditingHelper = auditingHelper;
        _systemClock = systemClock;
        _userService = userService;
        _cacheFlags = cacheFlags;
    }

    protected override async Task<CommandResult> ApplyUpdates(TournamentGame game, EditTournamentGameDto update, CancellationToken token)
    {
        var latestSeason = await _seasonService.GetLatest(token);
        var user = (await _userService.GetUser(token))!;

        if (latestSeason == null)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Unable to add or update game, no season exists",
            };
        }

        game.Address = update.Address;
        game.Date = update.Date;
        game.SeasonId = latestSeason.Id;
        game.Notes = update.Notes;
        game.Type = update.Type;
        game.Sides = await update.Sides.SelectAsync(s => _tournamentSideAdapter.Adapt(s, token)).ToList();
        game.Round = update.Round != null ? await _tournamentRoundAdapter.Adapt(update.Round, token) : null;
        game.OneEighties = update.OneEighties.Select(p => AdaptToPlayer(p, user)).ToList();
        game.Over100Checkouts = update.Over100Checkouts.Select(p => AdaptToHiCheckPlayer(p, user)).ToList();

        foreach (var side in game.Sides)
        {
            await SetSideUpdated(side, token);
        }

        await SetUpdated(game.Round, game.Sides, token);

        _cacheFlags.EvictDivisionDataCacheForSeasonId = game.SeasonId;
        return CommandResult.SuccessNoMessage;
    }

    private async Task SetUpdated(TournamentRound? round, IReadOnlyCollection<TournamentSide> sides, CancellationToken token)
    {
        if (round == null)
        {
            return;
        }

        foreach (var side in round.Sides.Where(s => s.Id == default))
        {
            await SetSideUpdatedAndLinkToRootSide(side, sides, token);
        }

        await SetRoundUpdated(round, token);

        await SetUpdated(round.NextRound, sides, token);
    }

    private async Task SetSideUpdated(TournamentSide side, CancellationToken token)
    {
        if (side.Id == default)
        {
            side.Id = Guid.NewGuid();
        }
        await _auditingHelper.SetUpdated(side, token);

        await SetPlayersUpdated(side.Players, token);
    }

    private async Task SetSideUpdatedAndLinkToRootSide(TournamentSide side, IReadOnlyCollection<TournamentSide> sides, CancellationToken token)
    {
        var sideOrderedPlayers = side.Players.OrderBy(p => p.Id).Select(p => p.Id).ToArray();
        var equivalentSide = sides.SingleOrDefault(s => s.Players.OrderBy(p => p.Id).Select(p => p.Id).SequenceEqual(sideOrderedPlayers));
        if (equivalentSide != null)
        {
            side.Id = equivalentSide.Id;
        }
        await _auditingHelper.SetUpdated(side, token);

        await SetPlayersUpdated(side.Players, token);
    }

    private async Task SetRoundUpdated(TournamentRound round, CancellationToken token)
    {
        if (round.Id == default)
        {
            round.Id = Guid.NewGuid();
        }
        await _auditingHelper.SetUpdated(round, token);

        foreach (var match in round.Matches)
        {
            await SetMatchUpdated(match, token);
        }
    }

    private async Task SetMatchUpdated(TournamentMatch match, CancellationToken token)
    {
        if (match.Id == default)
        {
            match.Id = Guid.NewGuid();
        }
        await _auditingHelper.SetUpdated(match, token);
    }

    private async Task SetPlayersUpdated(List<TournamentPlayer> players, CancellationToken token)
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

    private NotablePlayer AdaptToHiCheckPlayer(EditTournamentGameDto.TournamentOver100CheckoutDto player, UserDto user)
    {
        return new NotablePlayer
        {
            Id = player.Id,
            Name = player.Name,
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Editor = user.Name,
            Updated = _systemClock.UtcNow.UtcDateTime,
            Notes = player.Notes,
        };
    }
}