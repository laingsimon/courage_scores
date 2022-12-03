namespace CourageScores.Services.Report;

public class PlayerDetails
{
    public string PlayerName { get; init; } = null!;
    public Guid TeamId { get; init; }
    public string TeamName { get; init; } = null!;
}