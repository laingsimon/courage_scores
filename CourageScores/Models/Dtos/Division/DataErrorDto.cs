using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DataErrorDto
{
    public string Message { get; set; } = null!;
    public Guid? GameId { get; set; }
    public Guid? TournamentId { get; set; }
    public Guid? PlayerId { get; set; }
    public Guid? TeamId { get; set; }
}