using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class GameMatchAdapter : IAdapter<GameMatch, GameMatchDto>
{
    private readonly IAdapter<GamePlayer, GamePlayerDto> _gamePlayerAdapter;

    public GameMatchAdapter(IAdapter<GamePlayer, GamePlayerDto> gamePlayerAdapter)
    {
        _gamePlayerAdapter = gamePlayerAdapter;
    }

    public async Task<GameMatchDto> Adapt(GameMatch model, CancellationToken token)
    {
        return new GameMatchDto
        {
            Id = model.Id,
            AwayPlayers = await model.AwayPlayers.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            AwayScore = model.AwayScore,
            HomePlayers = await model.HomePlayers.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            HomeScore = model.HomeScore,
        }.AddAuditProperties(model);
    }

    public async Task<GameMatch> Adapt(GameMatchDto dto, CancellationToken token)
    {
        return new GameMatch
        {
            Id = dto.Id,
            AwayPlayers = await dto.AwayPlayers.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            AwayScore = dto.AwayScore,
            HomePlayers = await dto.HomePlayers.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            HomeScore = dto.HomeScore,
        }.AddAuditProperties(dto);
    }
}