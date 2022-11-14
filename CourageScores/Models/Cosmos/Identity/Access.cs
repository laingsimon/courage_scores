namespace CourageScores.Models.Cosmos.Identity;

public class Access
{
    public bool ManageAccess { get; set; }
    public bool ManageDivisions { get; set; }
    public bool ManageGames { get; set; }
    public bool ManagePlayers { get; set; }
    public bool ManageScores { get; set; }
    public bool ManageSeasons { get; set; }
    public bool ManageTeams { get; set; }
}