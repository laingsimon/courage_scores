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

    public async Task<TournamentMatchDto> Adapt(TournamentMatch model, CancellationToken token)
    {
        return new TournamentMatchDto
        {
            Id = model.Id,
            ScoreA = model.ScoreA,
            ScoreB = model.ScoreB,
            SideA = await _tournamentSideAdapter.Adapt(model.SideA, token),
            SideB = await _tournamentSideAdapter.Adapt(model.SideB, token),
        }.AddAuditProperties(model);
    }

    public async Task<TournamentMatch> Adapt(TournamentMatchDto dto, CancellationToken token)
    {
        return new TournamentMatch
        {
            Id = dto.Id,
            ScoreA = dto.ScoreA,
            ScoreB = dto.ScoreB,
            SideA = await _tournamentSideAdapter.Adapt(dto.SideA, token),
            SideB = await _tournamentSideAdapter.Adapt(dto.SideB, token),
        }.AddAuditProperties(dto);
    }
}