using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class TournamentRoundAdapter : IAdapter<TournamentRound, TournamentRoundDto>
{
    private readonly IAdapter<TournamentMatch, TournamentMatchDto> _matchAdapter;
    private readonly ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter;
    private readonly IAdapter<TournamentSide, TournamentSideDto> _sideAdapter;

    public TournamentRoundAdapter(
        IAdapter<TournamentMatch, TournamentMatchDto> matchAdapter,
        IAdapter<TournamentSide, TournamentSideDto> sideAdapter,
        ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> matchOptionAdapter)
    {
        _matchAdapter = matchAdapter;
        _sideAdapter = sideAdapter;
        _matchOptionAdapter = matchOptionAdapter;
    }

    public async Task<TournamentRoundDto> Adapt(TournamentRound model, CancellationToken token)
    {
        return new TournamentRoundDto
        {
            Id = model.Id,
            Matches = await model.Matches.SelectAsync(m => _matchAdapter.Adapt(m, token)).ToList(),
            Sides = await model.Sides.SelectAsync(s => _sideAdapter.Adapt(s, token)).ToList(),
            NextRound = model.NextRound != null ? await Adapt(model.NextRound, token) : null,
            Name = model.Name,
            MatchOptions = await model.MatchOptions.SelectAsync(mo => _matchOptionAdapter.Adapt(mo, token)).ToList(),
        }.AddAuditProperties(model);
    }

    public async Task<TournamentRound> Adapt(TournamentRoundDto dto, CancellationToken token)
    {
        return new TournamentRound
        {
            Id = dto.Id,
            Matches = await dto.Matches.SelectAsync(m => _matchAdapter.Adapt(m, token)).ToList(),
            Sides = await dto.Sides.SelectAsync(s => _sideAdapter.Adapt(s, token)).ToList(),
            NextRound = dto.NextRound != null ? await Adapt(dto.NextRound, token) : null,
            Name = dto.Name?.Trim(),
            MatchOptions = await dto.MatchOptions.SelectAsync(mo => _matchOptionAdapter.Adapt(mo, token)).ToList(),
        }.AddAuditProperties(dto);
    }
}