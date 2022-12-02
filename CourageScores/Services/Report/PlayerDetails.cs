namespace CourageScores.Services.Report;

public class PlayerDetails
{
    public string PlayerName { get; set; } = null!;
    public Guid TeamId { get; set; }
    public string TeamName { get; set; } = null!;
}