using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Game;

public class TournamentMatchAdapter : IAdapter<TournamentMatch, TournamentMatchDto>
{
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;
    private readonly IUserService _userService;

    public TournamentMatchAdapter(
        IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter,
        IUserService userService)
    {
        _tournamentSideAdapter = tournamentSideAdapter;
        _userService = userService;
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
            SaygId = model.SaygId,
        }.AddAuditProperties(model);
    }

    public async Task<TournamentMatch> Adapt(TournamentMatchDto dto, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var permitted = user?.Access?.RecordScoresAsYouGo == true;

        return new TournamentMatch
        {
            Id = dto.Id,
            ScoreA = dto.ScoreA,
            ScoreB = dto.ScoreB,
            SideA = await _tournamentSideAdapter.Adapt(dto.SideA, token),
            SideB = await _tournamentSideAdapter.Adapt(dto.SideB, token),
            SaygId = dto.SaygId != null && permitted ? dto.SaygId : null,
        }.AddAuditProperties(dto);
    }
}