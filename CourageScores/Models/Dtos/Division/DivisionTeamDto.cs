namespace CourageScores.Models.Dtos.Division;

public class DivisionTeamDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public int Played { get; set; }
    public int Points { get; set; }
    public int Won { get; set; }
    public int Lost { get; set; }
    public int Drawn { get; set; }
    public int Difference { get; set; }
    public string Address { get; set; } = null!;
}