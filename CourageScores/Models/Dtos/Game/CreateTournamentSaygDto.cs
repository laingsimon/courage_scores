using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

[ExcludeFromCodeCoverage]
public class CreateTournamentSaygDto
{
    /// <summary>
    /// The id of the match in the given round where the SAYG data should be created
    /// </summary>
    public Guid MatchId { get; set; }
}