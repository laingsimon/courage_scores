using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

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

    public GameMatchDto Adapt(GameMatch model)
    {
        return new GameMatchDto
        {
            Id = model.Id,
            AwayPlayers = model.AwayPlayers.Select(_gamePlayerAdapter.Adapt).ToList(),
            AwayScore = model.AwayScore,
            HomePlayers = model.HomePlayers.Select(_gamePlayerAdapter.Adapt).ToList(),
            HomeScore = model.HomeScore,
            OneEighties = model.OneEighties.Select(_gamePlayerAdapter.Adapt).ToList(),
            Over100Checkouts = model.Over100Checkouts.Select(_notablePlayerAdapter.Adapt).ToList(),
            StartingScore = model.StartingScore,
            NumberOfLegs = model.NumberOfLegs,
        }.AddAuditProperties(model);
    }

    public GameMatch Adapt(GameMatchDto dto)
    {
        return new GameMatch
        {
            Id = dto.Id,
            AwayPlayers = dto.AwayPlayers.Select(_gamePlayerAdapter.Adapt).ToList(),
            AwayScore = dto.AwayScore,
            HomePlayers = dto.HomePlayers.Select(_gamePlayerAdapter.Adapt).ToList(),
            HomeScore = dto.HomeScore,
            OneEighties = dto.OneEighties.Select(_gamePlayerAdapter.Adapt).ToList(),
            Over100Checkouts = dto.Over100Checkouts.Select(_notablePlayerAdapter.Adapt).ToList(),
            StartingScore = dto.StartingScore,
            NumberOfLegs = dto.NumberOfLegs,
        }.AddAuditProperties(dto);
    }
}