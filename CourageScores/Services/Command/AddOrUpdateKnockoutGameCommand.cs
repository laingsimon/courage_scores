using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Repository;

namespace CourageScores.Services.Command;

public class AddOrUpdateKnockoutGameCommand : AddOrUpdateCommand<KnockoutGame, EditKnockoutGameDto>
{
    private readonly IGenericRepository<Models.Cosmos.Season> _seasonRepository;
    private readonly IAdapter<KnockoutSide, KnockoutSideDto> _knockoutSideAdapter;

    public AddOrUpdateKnockoutGameCommand(
        IGenericRepository<Models.Cosmos.Season> seasonRepository,
        IAdapter<KnockoutSide, KnockoutSideDto> knockoutSideAdapter)
    {
        _seasonRepository = seasonRepository;
        _knockoutSideAdapter = knockoutSideAdapter;
    }

    protected override async Task<CommandResult> ApplyUpdates(KnockoutGame game, EditKnockoutGameDto update, CancellationToken token)
    {
        var allSeasons = await _seasonRepository.GetAll(token).ToList();
        var latestSeason = allSeasons.MaxBy(s => s.EndDate);

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
        game.DivisionId = update.DivisionId;
        game.SeasonId = latestSeason.Id;
        game.Sides = await update.Sides.SelectAsync(s => _knockoutSideAdapter.Adapt(s)).ToList();

        return CommandResult.SuccessNoMessage;
    }
}