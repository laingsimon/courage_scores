using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class TournamentGameAdapter : IAdapter<TournamentGame, TournamentGameDto>
{
    private readonly IAdapter<TournamentRound, TournamentRoundDto> _roundAdapter;
    private readonly IAdapter<TournamentSide, TournamentSideDto> _sideAdapter;
    private readonly IAdapter<GamePlayer, GamePlayerDto> _gamePlayerAdapter;
    private readonly IAdapter<NotablePlayer, NotablePlayerDto> _notablePlayerAdapter;

    public TournamentGameAdapter(
        IAdapter<TournamentRound, TournamentRoundDto> roundAdapter,
        IAdapter<TournamentSide, TournamentSideDto> sideAdapter,
        IAdapter<GamePlayer, GamePlayerDto> gamePlayerAdapter,
        IAdapter<NotablePlayer, NotablePlayerDto> notablePlayerAdapter)
    {
        _roundAdapter = roundAdapter;
        _sideAdapter = sideAdapter;
        _gamePlayerAdapter = gamePlayerAdapter;
        _notablePlayerAdapter = notablePlayerAdapter;
    }

    public async Task<TournamentGameDto> Adapt(TournamentGame model, CancellationToken token)
    {
        return new TournamentGameDto
        {
            Id = model.Id,
            Round = model.Round != null ? await _roundAdapter.Adapt(model.Round, token) : null,
            Date = model.Date,
            Sides = await model.Sides.SelectAsync(s => _sideAdapter.Adapt(s, token)).ToList(),
            SeasonId = model.SeasonId,
            Address = model.Address,
            OneEighties = await model.OneEighties.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            Over100Checkouts = await model.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
        }.AddAuditProperties(model);
    }

    public async Task<TournamentGame> Adapt(TournamentGameDto dto, CancellationToken token)
    {
        return new TournamentGame
        {
            Id = dto.Id,
            Round = dto.Round != null ? await _roundAdapter.Adapt(dto.Round, token) : null,
            Date = dto.Date,
            Sides = await dto.Sides.SelectAsync(s => _sideAdapter.Adapt(s, token)).ToList(),
            SeasonId = dto.SeasonId,
            Address = dto.Address.Trim(),
            OneEighties = await dto.OneEighties.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            Over100Checkouts = await dto.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
        }.AddAuditProperties(dto);
    }
}
