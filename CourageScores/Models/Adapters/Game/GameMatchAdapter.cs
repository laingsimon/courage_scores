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

    public async Task<GameMatchDto> Adapt(GameMatch model)
    {
        return new GameMatchDto
        {
            Id = model.Id,
            AwayPlayers = await model.AwayPlayers.SelectAsync(_gamePlayerAdapter.Adapt).ToList(),
            AwayScore = model.AwayScore,
            HomePlayers = await model.HomePlayers.SelectAsync(_gamePlayerAdapter.Adapt).ToList(),
            HomeScore = model.HomeScore,
            OneEighties = await model.OneEighties.SelectAsync(_gamePlayerAdapter.Adapt).ToList(),
            Over100Checkouts = await model.Over100Checkouts.SelectAsync(_notablePlayerAdapter.Adapt).ToList(),
            StartingScore = model.StartingScore,
            NumberOfLegs = model.NumberOfLegs,
        }.AddAuditProperties(model);
    }

    public async Task<GameMatch> Adapt(GameMatchDto dto)
    {
        return new GameMatch
        {
            Id = dto.Id,
            AwayPlayers = await dto.AwayPlayers.SelectAsync(_gamePlayerAdapter.Adapt).ToList(),
            AwayScore = dto.AwayScore,
            HomePlayers = await dto.HomePlayers.SelectAsync(_gamePlayerAdapter.Adapt).ToList(),
            HomeScore = dto.HomeScore,
            OneEighties = await dto.OneEighties.SelectAsync(_gamePlayerAdapter.Adapt).ToList(),
            Over100Checkouts = await dto.Over100Checkouts.SelectAsync(_notablePlayerAdapter.Adapt).ToList(),
            StartingScore = dto.StartingScore,
            NumberOfLegs = dto.NumberOfLegs,
        }.AddAuditProperties(dto);
    }
}