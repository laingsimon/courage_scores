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
    public bool ViewExceptions { get; set; }
    public bool RecordScoresAsYouGo { get; set; }
    public bool ManageTournaments { get; set; }
    public bool RunHealthChecks { get; set; }
    public bool ManageSeasonTemplates { get; set; }
    public bool ShowDebugOptions { get; set; }
    public bool ManageSockets { get; set; }
    public bool UseWebSockets { get; set; }
    public bool EnterTournamentResults { get; set; }
    public bool UploadPhotos { get; set; }
    public bool DeleteAnyPhoto { get; set; }
    public bool ViewAnyPhoto { get; set; }
    public bool BulkDeleteLeagueFixtures { get; set; }
    public bool ManageFeatures { get; set; }
    public bool KioskMode { get; set; }
}