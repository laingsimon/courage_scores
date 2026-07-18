using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Game;

public class TournamentMatchAdapter : IAdapter<TournamentMatch, TournamentMatchDto>
{
    private readonly ISimpleAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;
    private readonly IUserService _userService;
    private readonly IAccessService _accessService;

    public TournamentMatchAdapter(
        ISimpleAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter,
        IUserService userService,
        IAccessService accessService)
    {
        _tournamentSideAdapter = tournamentSideAdapter;
        _userService = userService;
        _accessService = accessService;
    }

    public async Task<TournamentMatchDto> Adapt(TournamentMatch model, UserAccessContext context, CancellationToken token)
    {
        return new TournamentMatchDto
        {
            Id = model.Id,
            ScoreA = model.ScoreA,
            ScoreB = model.ScoreB,
            SideA = model.SideA != null ? await _tournamentSideAdapter.Adapt(model.SideA, context, token) : null,
            SideB = model.SideB != null ? await _tournamentSideAdapter.Adapt(model.SideB, context, token) : null,
            SaygId = model.SaygId,
        }.AddAuditProperties(model);
    }

    public async Task<TournamentMatch> Adapt(TournamentMatchDto dto, UserAccessContext context, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var permitted = await _accessService.HasAccess(user, AccessOption.RecordScoresAsYouGo, context, token);

        return new TournamentMatch
        {
            Id = dto.Id,
            ScoreA = dto.ScoreA,
            ScoreB = dto.ScoreB,
            SideA = dto.SideA != null ? await _tournamentSideAdapter.Adapt(dto.SideA, context, token) : null,
            SideB = dto.SideB != null ? await _tournamentSideAdapter.Adapt(dto.SideB, context, token) : null,
            SaygId = dto.SaygId != null && permitted ? dto.SaygId : null,
        }.AddAuditProperties(dto);
    }
}
