using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Identity;

[ExcludeFromCodeCoverage]
public class AccessDto
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
    public bool ViewExceptions { get; set; }
}
