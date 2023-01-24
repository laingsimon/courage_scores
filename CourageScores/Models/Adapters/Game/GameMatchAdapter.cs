using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class GameMatchAdapter : IAdapter<GameMatch, GameMatchDto>
{
    private readonly IAdapter<GamePlayer, GamePlayerDto> _gamePlayerAdapter;
    private readonly IAdapter<NotablePlayer, NotablePlayerDto> _notablePlayerAdapter;

    public GameMatchAdapter(
        IAdapter<GamePlayer, GamePlayerDto> gamePlayerAdapter,
        IAdapter<NotablePlayer, NotablePlayerDto> notablePlayerAdapter)
    {
        _gamePlayerAdapter = gamePlayerAdapter;
        _notablePlayerAdapter = notablePlayerAdapter;
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
            OneEighties = model.Version == 1
                ? await model.OneEighties.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList()
                : new List<GamePlayerDto>(),
            Over100Checkouts = model.Version == 1
                ? await model.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList()
                : new List<NotablePlayerDto>(),
            StartingScore = model.StartingScore,
            NumberOfLegs = model.NumberOfLegs,
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
            OneEighties = await dto.OneEighties.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            Over100Checkouts = await dto.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
            StartingScore = dto.StartingScore,
            NumberOfLegs = dto.NumberOfLegs,
        }.AddAuditProperties(dto);
    }
}