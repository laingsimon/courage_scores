using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Services.Command;

public class AddOrUpdateGameCommand : AddOrUpdateCommand<Game, EditGameDto>
{
    private readonly IAdapter<GameTeam, GameTeamDto> _gameTeamAdapter;

    public AddOrUpdateGameCommand(IAdapter<GameTeam, GameTeamDto> gameTeamAdapter)
    {
        _gameTeamAdapter = gameTeamAdapter;
    }

    protected override void ApplyUpdates(Game game, EditGameDto update)
    {
        game.Address = update.Address;
        game.Date = update.Date;
        game.DivisionId = update.DivisionId;
        game.Home = _gameTeamAdapter.Adapt(update.Home);
        game.Away = _gameTeamAdapter.Adapt(update.Away);
    }
}