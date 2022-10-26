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
            Away = _gameTeamAdapter.Adapt(model.Away),
            Date = model.Date,
            Home = _gameTeamAdapter.Adapt(model.Home),
            Id = model.Id,
            Matches = model.Matches?.Select(_gameMatchAdapter.Adapt).ToList() ?? new List<GameMatchDto>(),
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model);
    }

    public Cosmos.Game.Game Adapt(GameDto dto)
    {
        return new Cosmos.Game.Game
        {
            Address = dto.Address,
            Away = _gameTeamAdapter.Adapt(dto.Away),
            Date = dto.Date,
            Home = _gameTeamAdapter.Adapt(dto.Home),
            Id = dto.Id,
            Matches = dto.Matches?.Select(_gameMatchAdapter.Adapt).ToList() ?? new List<GameMatch>(),
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto);
    }
}