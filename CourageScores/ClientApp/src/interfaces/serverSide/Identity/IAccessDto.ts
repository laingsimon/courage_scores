// see CourageScores.Models.Dtos.Identity.AccessDto
export interface IAccessDto {
    manageAccess?: boolean;
    manageDivisions?: boolean;
    manageGames?: boolean;
    manageNotes?: boolean;
    managePlayers?: boolean;
    manageScores?: boolean;
    manageSeasons?: boolean;
    manageTeams?: boolean;
    runReports?: boolean;
    exportData?: boolean;
    importData?: boolean;
    inputResults?: boolean;
    viewExceptions?: boolean;
    recordScoresAsYouGo?: boolean;
    manageTournaments?: boolean;
    runHealthChecks?: boolean;
    manageSeasonTemplates?: boolean;
    showDebugOptions?: boolean;
    manageSockets?: boolean;
    useWebSockets?: boolean;
}
