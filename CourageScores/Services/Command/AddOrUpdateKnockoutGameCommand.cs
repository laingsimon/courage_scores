using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Command;

public class AddOrUpdateKnockoutGameCommand : AddOrUpdateCommand<KnockoutGame, EditKnockoutGameDto>
{
    private readonly IGenericRepository<Models.Cosmos.Season> _seasonRepository;
    private readonly IAdapter<KnockoutSide, KnockoutSideDto> _knockoutSideAdapter;
    private readonly IAdapter<KnockoutRound, KnockoutRoundDto> _knockoutRoundAdapter;
    private readonly IAuditingHelper _auditingHelper;
    private readonly ISystemClock _systemClock;
    private readonly IUserService _userService;

    public AddOrUpdateKnockoutGameCommand(
        IGenericRepository<Models.Cosmos.Season> seasonRepository,
        IAdapter<KnockoutSide, KnockoutSideDto> knockoutSideAdapter,
        IAdapter<KnockoutRound, KnockoutRoundDto> knockoutRoundAdapter,
        IAuditingHelper auditingHelper,
        ISystemClock systemClock,
        IUserService userService)
    {
        _seasonRepository = seasonRepository;
        _knockoutSideAdapter = knockoutSideAdapter;
        _knockoutRoundAdapter = knockoutRoundAdapter;
        _auditingHelper = auditingHelper;
        _systemClock = systemClock;
        _userService = userService;
    }

    protected override async Task<CommandResult> ApplyUpdates(KnockoutGame game, EditKnockoutGameDto update, CancellationToken token)
    {
        var allSeasons = await _seasonRepository.GetAll(token).ToList();
        var latestSeason = allSeasons.MaxBy(s => s.EndDate);
        var user = await _userService.GetUser();

        if (user == null)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Knockout cannot be updated, not logged in",
            };
        }

        if (user.Access?.ManageScores != true)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Knockout cannot be updated, not permitted",
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
        game.Sides = await update.Sides.SelectAsync(s => _knockoutSideAdapter.Adapt(s)).ToList();
        game.Round = update.Round != null ? await _knockoutRoundAdapter.Adapt(update.Round) : null;
        game.OneEighties = update.OneEighties.Select(p => AdaptToPlayer(p, user)).ToList();
        game.Over100Checkouts = update.Over100Checkouts.Select(p => AdaptToHiCheckPlayer(p, user)).ToList();

        foreach (var knockoutSide in game.Sides)
        {
            if (knockoutSide.Id == default)
            {
                knockoutSide.Id = Guid.NewGuid();
            }
            await _auditingHelper.SetUpdated(knockoutSide);

            await SetIds(knockoutSide.Players);
        }
        await SetIds(game.Round, game.Sides);

        return CommandResult.SuccessNoMessage;
    }

    private async Task SetIds(KnockoutRound? round, IReadOnlyCollection<KnockoutSide> sides)
    {
        if (round == null)
        {
            return;
        }

        if (round.Id == default)
        {
            round.Id = Guid.NewGuid();
        }
        await _auditingHelper.SetUpdated(round);

        foreach (var knockoutSide in round.Sides.Where(s => s.Id == default))
        {
            var equivalentSide = sides.SingleOrDefault(s => s.Players.OrderBy(p => p.Id).SequenceEqual(knockoutSide.Players.OrderBy(p => p.Id)));
            if (equivalentSide != null)
            {
                knockoutSide.Id = equivalentSide.Id;
            }
            await _auditingHelper.SetUpdated(knockoutSide);

            await SetIds(knockoutSide.Players);
        }

        foreach (var match in round.Matches)
        {
            if (match.Id == default)
            {
                match.Id = Guid.NewGuid();
            }
            await _auditingHelper.SetUpdated(match);
        }

        await SetIds(round.NextRound, sides);
    }

    private async Task SetIds(List<GamePlayer> players)
    {
        foreach (var player in players)
        {
            await _auditingHelper.SetUpdated(player);
        }
    }

    private GamePlayer AdaptToPlayer(EditKnockoutGameDto.RecordScoresPlayerDto player, UserDto user)
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

    private NotablePlayer AdaptToHiCheckPlayer(EditKnockoutGameDto.Over100CheckoutDto player, UserDto user)
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