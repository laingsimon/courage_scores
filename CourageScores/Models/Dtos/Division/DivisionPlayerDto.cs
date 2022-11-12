namespace CourageScores.Models.Dtos.Division;

public class DivisionPlayerDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public int Rank { get; set; }
    public string Name { get; set; } = null!;
    public string Team { get; set; } = null!;
    public int Played { get; set; }
    public int Won { get; set; }
    public int Lost { get; set; }
    public int Points { get; set; }
    public double WinPercentage { get; set; }
    public int OneEighties { get; set; }
    public int Over100Checkouts { get; set; }
}