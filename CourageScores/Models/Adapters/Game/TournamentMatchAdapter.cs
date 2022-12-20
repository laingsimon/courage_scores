using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;

namespace CourageScores.Models.Adapters.Game;

public class TournamentMatchAdapter : IAdapter<TournamentMatch, TournamentMatchDto>
{
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;

    public TournamentMatchAdapter(IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter)
    {
        _tournamentSideAdapter = tournamentSideAdapter;
    }

    public async Task<TournamentMatchDto> Adapt(TournamentMatch model)
    {
        return new TournamentMatchDto
        {
            Id = model.Id,
            ScoreA = model.ScoreA,
            ScoreB = model.ScoreB,
            SideA = await _tournamentSideAdapter.Adapt(model.SideA),
            SideB = await _tournamentSideAdapter.Adapt(model.SideB),
        }.AddAuditProperties(model);
    }

    public async Task<TournamentMatch> Adapt(TournamentMatchDto dto)
    {
        return new TournamentMatch
        {
            Id = dto.Id,
            ScoreA = dto.ScoreA,
            ScoreB = dto.ScoreB,
            SideA = await _tournamentSideAdapter.Adapt(dto.SideA),
            SideB = await _tournamentSideAdapter.Adapt(dto.SideB),
        }.AddAuditProperties(dto);
    }
}