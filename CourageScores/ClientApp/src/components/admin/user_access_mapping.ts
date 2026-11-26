import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

export interface IAccessMapping {
    option: AccessOption;
    section: string;
    name: string;
    description?: string;
}

export const accessMappings: IAccessMapping[] = [
    {
        option: AccessOption.analyseMatches,
        section: 'Superleague',
        name: 'Analyse scores',
        description: 'Analyse scores across fixtures',
    },
    {
        option: AccessOption.bulkDeleteLeagueFixtures,
        section: 'League',
        name: 'Bulk delete fixtures',
        description: 'Delete all unplayed fixtures in a season in one go',
    },
    {
        option: AccessOption.deleteAnyPhoto,
        section: 'League',
        name: 'Delete photos from anyone',
    },
    {
        option: AccessOption.exportData,
        section: 'System admin',
        name: 'Export data (backup)',
    },
    {
        option: AccessOption.enterTournamentResults,
        section: 'Superleague',
        name: 'Enter tournament results',
        description: 'Record scores for tournaments without editing details',
    },
    {
        option: AccessOption.inputResults,
        section: 'League',
        name: 'Input results',
        description: 'Enter league-fixture results for their team',
    },
    {
        option: AccessOption.importData,
        section: 'System admin',
        name: 'Import data (restore)',
    },
    {
        option: AccessOption.kioskMode,
        section: 'Superleague',
        name: 'Score results in full screen',
        description: 'Enter full screen when recording scores',
    },
    {
        option: AccessOption.loginServiceAccounts,
        section: 'Superleague',
        name: 'Login service accounts',
        description: 'Login tables and tv accounts remotely',
    },
    {
        option: AccessOption.manageAccess,
        section: 'System admin',
        name: 'Manage user access',
        description: 'Manage who can do what',
    },
    {
        option: AccessOption.manageScores,
        section: 'League',
        name: 'Manage scores',
        description: '⚠️ Enter league-fixture results for any team',
    },
    {
        option: AccessOption.managePlayers,
        section: 'League',
        name: 'Manage players',
        description: 'Add/Edit/Delete players',
    },
    {
        option: AccessOption.manageTournaments,
        section: 'League',
        name: 'Manage tournaments',
        description: 'Create/Edit/Delete tournaments and record scores',
    },
    {
        option: AccessOption.manageGames,
        section: 'League',
        name: 'Manage games',
        description: 'Create/Edit/Delete league fixtures',
    },
    {
        option: AccessOption.manageDivisions,
        section: 'League',
        name: 'Manage divisions',
    },
    {
        option: AccessOption.manageFeatures,
        section: 'System admin',
        name: 'Manage features',
        description: 'Configure system features',
    },
    {
        option: AccessOption.manageSockets,
        section: 'System admin',
        name: 'Manage sockets',
        description: 'Manage who is viewing live results',
    },
    {
        option: AccessOption.manageSeasonTemplates,
        section: 'League',
        name: 'Manage season templates',
        description: 'Manage the templates used to create new seasons',
    },
    {
        option: AccessOption.runReports,
        section: 'League',
        name: 'Run reports',
    },
    {
        option: AccessOption.manageNotes,
        section: 'League',
        name: 'Manage notes',
    },
    {
        option: AccessOption.manageSeasons,
        section: 'League',
        name: 'Manage seasons',
    },
    {
        option: AccessOption.manageTeams,
        section: 'League',
        name: 'Manage teams',
    },
    {
        option: AccessOption.runDataQueries,
        section: 'System admin',
        name: 'Run data queries',
        description: '⚠️ Query the data model',
    },
    {
        option: AccessOption.showDebugOptions,
        section: 'System admin',
        name: 'Show debug options',
        description: 'See additional debugging options',
    },
    {
        option: AccessOption.useWebSockets,
        section: 'Superleague',
        name: 'Show live results',
        description:
            "Show results as they're recorded on other devices (tv/mobile)",
    },
    {
        option: AccessOption.uploadPhotos,
        section: 'League',
        name: 'Upload photos',
    },
    {
        option: AccessOption.viewAnyPhoto,
        section: 'League',
        name: 'View photos from anyone',
        description: '⚠️ (allows viewing of man-of-the-match submissions)',
    },
    {
        option: AccessOption.viewExceptions,
        section: 'System admin',
        name: 'View exceptions',
        description: 'View any errors reported in the system',
    },
];
