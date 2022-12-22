using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Game;

public class TournamentRoundAdapter : IAdapter<TournamentRound, TournamentRoundDto>
{
    private readonly IAdapter<TournamentMatch, TournamentMatchDto> _matchAdapter;
    private readonly IAdapter<TournamentSide, TournamentSideDto> _sideAdapter;

    public TournamentRoundAdapter(
        IAdapter<TournamentMatch, TournamentMatchDto> matchAdapter,
        IAdapter<TournamentSide, TournamentSideDto> sideAdapter)
    {
        _matchAdapter = matchAdapter;
        _sideAdapter = sideAdapter;
    }

    public async Task<TournamentRoundDto> Adapt(TournamentRound model)
    {
        return new TournamentRoundDto
        {
            Id = model.Id,
            Matches = await model.Matches.SelectAsync(m => _matchAdapter.Adapt(m)).ToList(),
            Sides = await model.Sides.SelectAsync(s => _sideAdapter.Adapt(s)).ToList(),
            NextRound = model.NextRound != null ? await Adapt(model.NextRound) : null,
            Name = model.Name,
        }.AddAuditProperties(model);
    }

    public async Task<TournamentRound> Adapt(TournamentRoundDto dto)
    {
        return new TournamentRound
        {
            Id = dto.Id,
            Matches = await dto.Matches.SelectAsync(m => _matchAdapter.Adapt(m)).ToList(),
            Sides = await dto.Sides.SelectAsync(s => _sideAdapter.Adapt(s)).ToList(),
            NextRound = dto.NextRound != null ? await Adapt(dto.NextRound) : null,
            Name = dto.Name,
        }.AddAuditProperties(dto);
    }
}