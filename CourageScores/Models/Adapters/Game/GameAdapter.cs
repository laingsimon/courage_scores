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

    public async Task<GameDto> Adapt(Cosmos.Game.Game model, CancellationToken token)
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
            HomeSubmission = model.HomeSubmission != null ? await Adapt(model.HomeSubmission, token) : null,
            AwaySubmission = model.AwaySubmission != null ? await Adapt(model.AwaySubmission, token) : null,
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
        }.AddAuditProperties(dto);
    }
}