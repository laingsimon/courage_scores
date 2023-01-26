using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Identity;

[ExcludeFromCodeCoverage]
public class Access
{
    public bool ManageAccess { get; set; }
    public bool ManageDivisions { get; set; }
    public bool ManageGames { get; set; }
    public bool ManageNotes { get; set; }
    public bool ManagePlayers { get; set; }
    public bool ManageScores { get; set; }
    public bool ManageSeasons { get; set; }
    public bool ManageTeams { get; set; }
    public bool RunReports { get; set; }
    public bool ExportData { get; set; }
    public bool ImportData { get; set; }
    public bool InputResults { get; set; }
}