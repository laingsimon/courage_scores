namespace CourageScores.Models.Dtos.Division;

public class DivisionDataSeasonDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}