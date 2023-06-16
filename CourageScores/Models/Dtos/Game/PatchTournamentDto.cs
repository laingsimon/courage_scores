using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

/// <summary>
/// Update portions of a tournament fixture
/// </summary>
[ExcludeFromCodeCoverage]
public class PatchTournamentDto
{
    /// <summary>
    /// Optional round/match data to update
    /// </summary>
    public PatchTournamentRoundDto? Round { get; set; }

    /// <summary>
    /// Optional additional 180
    /// To remove 180s edit the tournament
    /// </summary>
    public TournamentPlayerDto? Additional180 { get; set; }

    /// <summary>
    /// Optional additional hi-check
    /// To remove hi-checks edit the tournament
    /// </summary>
    public NotableTournamentPlayerDto? AdditionalOver100Checkout { get; set; }
}