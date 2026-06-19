using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Identity;

[ExcludeFromCodeCoverage]
public class AccessDto
{
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageAccess { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageDivisions { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageGames { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageNotes { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManagePlayers { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageScores { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageSeasons { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageTeams { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool RunReports { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ExportData { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ImportData { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool InputResults { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ViewExceptions { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool RecordScoresAsYouGo { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageTournaments { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool RunHealthChecks { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageSeasonTemplates { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ShowDebugOptions { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageSockets { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool UseWebSockets { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool EnterTournamentResults { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool UploadPhotos { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ViewAnyPhoto { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool DeleteAnyPhoto { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool BulkDeleteLeagueFixtures { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool ManageFeatures { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool KioskMode { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool AnalyseMatches { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool RunDataQueries { get; set; }
    [Obsolete("Use AccessService to determine user access level")]
    public bool LoginServiceAccounts { get; set; }
}
