using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

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

    public async Task<GameDto> Adapt(Cosmos.Game.Game model)
    {
        return new GameDto
        {
            Address = model.Address,
            Away = await _gameTeamAdapter.Adapt(model.Away),
            Date = model.Date,
            Home = await _gameTeamAdapter.Adapt(model.Home),
            Id = model.Id,
            Matches = await model.Matches.SelectAsync(_gameMatchAdapter.Adapt).ToList(),
            DivisionId = model.DivisionId,
            SeasonId = model.SeasonId,
        }.AddAuditProperties(model);
    }

    public async Task<Cosmos.Game.Game> Adapt(GameDto dto)
    {
        return new Cosmos.Game.Game
        {
            Address = dto.Address,
            Away = await _gameTeamAdapter.Adapt(dto.Away),
            Date = dto.Date,
            Home = await _gameTeamAdapter.Adapt(dto.Home),
            Id = dto.Id,
            Matches = await dto.Matches.SelectAsync(_gameMatchAdapter.Adapt).ToList(),
            DivisionId = dto.DivisionId,
            SeasonId = dto.SeasonId,
        }.AddAuditProperties(dto);
    }
}