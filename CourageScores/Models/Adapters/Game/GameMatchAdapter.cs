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
            Author = model.Author,
            Created = model.Created,
            Editor = model.Editor,
            Id = model.Id,
            Updated = model.Updated,
            AwayPlayers = model.AwayPlayers.Select(_gamePlayerAdapter.Adapt).ToArray(),
            AwayScore = model.AwayScore,
            HomePlayers = model.HomePlayers.Select(_gamePlayerAdapter.Adapt).ToArray(),
            HomeScore = model.HomeScore,
            OneEighties = model.OneEighties.Select(_gamePlayerAdapter.Adapt).ToArray(),
            Over100Checkouts = model.Over100Checkouts.Select(_notablePlayerAdapter.Adapt).ToArray(),
            StartingScore = model.StartingScore,
            NumberOfLegs = model.NumberOfLegs,
        };
    }

    public GameMatch Adapt(GameMatchDto dto)
    {
        return new GameMatch
        {
            Author = dto.Author,
            Created = dto.Created,
            Editor = dto.Editor,
            Id = dto.Id,
            Updated = dto.Updated,
            AwayPlayers = dto.AwayPlayers.Select(_gamePlayerAdapter.Adapt).ToArray(),
            AwayScore = dto.AwayScore,
            HomePlayers = dto.HomePlayers.Select(_gamePlayerAdapter.Adapt).ToArray(),
            HomeScore = dto.HomeScore,
            OneEighties = dto.OneEighties.Select(_gamePlayerAdapter.Adapt).ToArray(),
            Over100Checkouts = dto.Over100Checkouts.Select(_notablePlayerAdapter.Adapt).ToArray(),
            StartingScore = dto.StartingScore,
            NumberOfLegs = dto.NumberOfLegs,
        };
    }
}