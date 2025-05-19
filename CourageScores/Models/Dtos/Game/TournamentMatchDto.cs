using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Analysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Representation of a match in a tournament round
/// </summary>
[ExcludeFromCodeCoverage]
public class TournamentMatchDto : AuditedDto
{
    /// <summary>
    /// Who is playing from side a
    /// </summary>
    public TournamentSideDto SideA { get; set; } = null!;

    /// <summary>
    /// Who is playing from side b
    /// </summary>
    public TournamentSideDto SideB { get; set; } = null!;

    /// <summary>
    /// The score for side a
    /// </summary>
    public int? ScoreA { get; set; }

    /// <summary>
    /// The score for side b
    /// </summary>
    public int? ScoreB { get; set; }

    public Guid? SaygId { get; set; }

    public async Task Accept(ISaygVisitor visitor, SaygFixtureVisitorContext fixtureContext, IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService, CancellationToken token)
    {
        if (SaygId == null)
        {
            return;
        }

        var sayg = await saygService.Get(SaygId.Value, token);
        if (sayg == null)
        {
            return;
        }

        var matchContext = new SaygMatchVisitorContext(
            FromSide(fixtureContext.Home, SideA),
            FromSide(fixtureContext.Away, SideB));
        await sayg.Accept(visitor, matchContext, token);
    }

    private static SaygTeamPlayer FromSide(string? team, TournamentSideDto side)
    {
        return new SaygTeamPlayer(
            team,
            side.Players.Count == 1 ? side.Players[0].Id : null,
            side.Name ?? string.Join(", ", side.Players.Select(p => p.Name)));
    }
}
