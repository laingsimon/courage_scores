using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class GameAdapter : IAdapter<Cosmos.Game.Game, GameDto>
{
    private readonly IAdapter<GameMatch, GameMatchDto> _gameMatchAdapter;
    private readonly IAdapter<GameTeam, GameTeamDto> _gameTeamAdapter;

    public GameAdapter(
        IAdapter<GameMatch, GameMatchDto> gameMatchAdapter,
        IAdapter<GameTeam, GameTeamDto> gameTeamAdapter)
    {
        _gameMatchAdapter = gameMatchAdapter;
        _gameTeamAdapter = gameTeamAdapter;
    }

    public GameDto Adapt(Cosmos.Game.Game model)
    {
        return new GameDto
        {
            Address = model.Address,
            Author = model.Author,
            Away = _gameTeamAdapter.Adapt(model.Away),
            Created = model.Created,
            Date = model.Date,
            Editor = model.Editor,
            Home = _gameTeamAdapter.Adapt(model.Home),
            Id = model.Id,
            Matches = model.Matches.Select(_gameMatchAdapter.Adapt).ToArray(),
            Updated = model.Updated,
            DivisionId = model.DivisionId,
        };
    }

    public Cosmos.Game.Game Adapt(GameDto model)
    {
        return new Cosmos.Game.Game
        {
            Address = model.Address,
            Author = model.Author,
            Away = _gameTeamAdapter.Adapt(model.Away),
            Created = model.Created,
            Date = model.Date,
            Editor = model.Editor,
            Home = _gameTeamAdapter.Adapt(model.Home),
            Id = model.Id,
            Matches = model.Matches.Select(_gameMatchAdapter.Adapt).ToArray(),
            Updated = model.Updated,
            DivisionId = model.DivisionId,
        };
    }
}