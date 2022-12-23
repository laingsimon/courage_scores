namespace CourageScores.Models.Dtos.Team;

public class EditTeamPlayerDto
{
    public string Name { get; set; } = null!;
    public bool Captain { get; set; }
    public Guid? GameId { get; set; }
    public string? EmailAddress { get; set; }
}