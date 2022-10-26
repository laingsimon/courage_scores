namespace CourageScores.Models.Dtos.Team;

public class EditTeamDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public Guid DivisionId { get; set; }
}