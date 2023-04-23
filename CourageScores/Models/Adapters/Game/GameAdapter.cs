using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class GameAdapter : IAdapter<Cosmos.Game.Game, GameDto>
{
    private readonly IAdapter<GameMatch, GameMatchDto> _gameMatchAdapter;
    private readonly IAdapter<GameTeam, GameTeamDto> _gameTeamAdapter;
    private readonly IAdapter<GamePlayer, GamePlayerDto> _gamePlayerAdapter;
    private readonly IAdapter<NotablePlayer, NotablePlayerDto> _notablePlayerAdapter;
    private readonly ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter;

    public GameAdapter(
        IAdapter<GameMatch, GameMatchDto> gameMatchAdapter,
        IAdapter<GameTeam, GameTeamDto> gameTeamAdapter,
        IAdapter<GamePlayer, GamePlayerDto> gamePlayerAdapter,
        IAdapter<NotablePlayer, NotablePlayerDto> notablePlayerAdapter,
        ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> matchOptionAdapter)
    {
        _gameMatchAdapter = gameMatchAdapter;
        _gameTeamAdapter = gameTeamAdapter;
        _gamePlayerAdapter = gamePlayerAdapter;
        _notablePlayerAdapter = notablePlayerAdapter;
        _matchOptionAdapter = matchOptionAdapter;
    }

    public async Task<GameDto> Adapt(Cosmos.Game.Game model, CancellationToken token)
    {
        var resultsPublished = model.Matches.Any();
        return await Adapt(model, resultsPublished, token);
    }

    private async Task<GameDto> Adapt(Cosmos.Game.Game model, bool resultsPublished, CancellationToken token)
    {
        return new GameDto
        {
            Address = model.Address,
            Away = await _gameTeamAdapter.Adapt(model.Away, token),
            Date = model.Date,
            Home = await _gameTeamAdapter.Adapt(model.Home, token),
            Id = model.Id,
            Matches = await model.Matches.SelectAsync(match => _gameMatchAdapter.Adapt(match, token)).ToList(),
            DivisionId = model.DivisionId,
            SeasonId = model.SeasonId,
            Postponed = model.Postponed,
            IsKnockout = model.IsKnockout,
            HomeSubmission = model.HomeSubmission != null ? await Adapt(model.HomeSubmission, resultsPublished, token) : null,
            AwaySubmission = model.AwaySubmission != null ? await Adapt(model.AwaySubmission, resultsPublished, token) : null,
            ResultsPublished = resultsPublished,
            OneEighties = await model.OneEighties.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            Over100Checkouts = await model.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
            MatchOptions = await model.MatchOptions.SelectAsync(mo => _matchOptionAdapter.Adapt(mo, token)).ToList(),
            AccoladesCount = model.AccoladesCount,
        }.AddAuditProperties(model);
    }

    public async Task<Cosmos.Game.Game> Adapt(GameDto dto, CancellationToken token)
    {
        return new Cosmos.Game.Game
        {
            Address = dto.Address.Trim(),
            Away = await _gameTeamAdapter.Adapt(dto.Away, token),
            Date = dto.Date,
            Home = await _gameTeamAdapter.Adapt(dto.Home, token),
            Id = dto.Id,
            Matches = await dto.Matches.SelectAsync(match => _gameMatchAdapter.Adapt(match, token)).ToList(),
            DivisionId = dto.DivisionId,
            SeasonId = dto.SeasonId,
            Postponed = dto.Postponed,
            IsKnockout = dto.IsKnockout,
            HomeSubmission = dto.HomeSubmission != null ? await Adapt(dto.HomeSubmission, token) : null,
            AwaySubmission = dto.AwaySubmission != null ? await Adapt(dto.AwaySubmission, token) : null,
            OneEighties = await dto.OneEighties.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            Over100Checkouts = await dto.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
            MatchOptions = await dto.MatchOptions.SelectAsync(mo => _matchOptionAdapter.Adapt(mo, token)).ToList(),
            AccoladesCount = dto.AccoladesCount,
        }.AddAuditProperties(dto);
    }
}