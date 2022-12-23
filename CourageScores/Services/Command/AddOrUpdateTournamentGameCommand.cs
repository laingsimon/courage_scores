using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class AddOrUpdateTournamentGameCommand : AddOrUpdateCommand<TournamentGame, EditTournamentGameDto>
{
    private readonly IGenericRepository<Models.Cosmos.Season> _seasonRepository;
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;
    private readonly IAdapter<TournamentRound, TournamentRoundDto> _tournamentRoundAdapter;
    private readonly IAuditingHelper _auditingHelper;
    private readonly ISystemClock _systemClock;
    private readonly IUserService _userService;

    public AddOrUpdateTournamentGameCommand(
        IGenericRepository<Models.Cosmos.Season> seasonRepository,
        IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter,
        IAdapter<TournamentRound, TournamentRoundDto> tournamentRoundAdapter,
        IAuditingHelper auditingHelper,
        ISystemClock systemClock,
        IUserService userService)
    {
        _seasonRepository = seasonRepository;
        _tournamentSideAdapter = tournamentSideAdapter;
        _tournamentRoundAdapter = tournamentRoundAdapter;
        _auditingHelper = auditingHelper;
        _systemClock = systemClock;
        _userService = userService;
    }

    protected override async Task<CommandResult> ApplyUpdates(TournamentGame game, EditTournamentGameDto update, CancellationToken token)
    {
        var allSeasons = await _seasonRepository.GetAll(token).ToList();
        var latestSeason = allSeasons.MaxBy(s => s.EndDate);
        var user = await _userService.GetUser(token);

        if (user == null)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Tournament game cannot be updated, not logged in",
            };
        }

        if (user.Access?.ManageScores != true)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Tournament game cannot be updated, not permitted",
            };
        }

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
        game.Sides = await update.Sides.SelectAsync(s => _tournamentSideAdapter.Adapt(s, token)).ToList();
        game.Round = update.Round != null ? await _tournamentRoundAdapter.Adapt(update.Round, token) : null;
        game.OneEighties = update.OneEighties.Select(p => AdaptToPlayer(p, user)).ToList();
        game.Over100Checkouts = update.Over100Checkouts.Select(p => AdaptToHiCheckPlayer(p, user)).ToList();

        foreach (var side in game.Sides)
        {
            if (side.Id == default)
            {
                side.Id = Guid.NewGuid();
            }
            await _auditingHelper.SetUpdated(side, token);

            await SetIds(side.Players, token);
        }
        await SetIds(game.Round, game.Sides, token);

        return CommandResult.SuccessNoMessage;
    }

    private async Task SetIds(TournamentRound? round, IReadOnlyCollection<TournamentSide> sides, CancellationToken token)
    {
        if (round == null)
        {
            return;
        }

        if (round.Id == default)
        {
            round.Id = Guid.NewGuid();
        }
        await _auditingHelper.SetUpdated(round, token);

        foreach (var side in round.Sides.Where(s => s.Id == default))
        {
            var equivalentSide = sides.SingleOrDefault(s => s.Players.OrderBy(p => p.Id).SequenceEqual(side.Players.OrderBy(p => p.Id)));
            if (equivalentSide != null)
            {
                side.Id = equivalentSide.Id;
            }
            await _auditingHelper.SetUpdated(side, token);

            await SetIds(side.Players, token);
        }

        foreach (var match in round.Matches)
        {
            if (match.Id == default)
            {
                match.Id = Guid.NewGuid();
            }
            await _auditingHelper.SetUpdated(match, token);
        }

        await SetIds(round.NextRound, sides, token);
    }

    private async Task SetIds(List<GamePlayer> players, CancellationToken token)
    {
        foreach (var player in players)
        {
            await _auditingHelper.SetUpdated(player, token);
        }
    }

    private GamePlayer AdaptToPlayer(EditTournamentGameDto.RecordTournamentScoresPlayerDto player, UserDto user)
    {
        return new GamePlayer
        {
            Id = player.Id,
            Name = player.Name,
            Author = user.Name,
            Created = _systemClock.UtcNow.UtcDateTime,
            Editor = user.Name,
            Updated = _systemClock.UtcNow.UtcDateTime,
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