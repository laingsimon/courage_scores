import { IUserAccessDto } from '../../interfaces/models/dtos/Identity/IUserAccessDto';
import { AccessLevelDto } from '../../interfaces/models/dtos/Identity/AccessLevelDto';

export interface IAccessLevels {
    [key: string]: AccessLevelDto;
}

export interface IRole extends IUserAccessDto {
    name: string;
}

const leagueAdminAccessLevels: IAccessLevels = {
    ManageAccess: {},
    ManageDivisions: {},
    ManageGames: {},
    ManageNotes: {},
    ManagePlayers: {},
    ManageScores: {},
    ManageSeasons: {},
    ManageTeams: {},
    RunReports: {},
    ExportData: {},
    InputResults: {},
    RecordScoresAsYouGo: {},
    ManageTournaments: {},
    RunHealthChecks: {},
    ManageSeasonTemplates: {},
    UploadPhotos: {},
    ViewAnyPhoto: {},
    DeleteAnyPhoto: {},
    BulkDeleteLeagueFixtures: {},
};
const superLeagueAdminAccessLevels: IAccessLevels = {
    ManageAccess: {},
    ManageDivisions: {},
    ManageGames: {},
    ManageNotes: {},
    ManagePlayers: {},
    ManageSeasons: {},
    ManageTeams: {},
    RecordScoresAsYouGo: {},
    ManageTournaments: {},
    EnterTournamentResults: {},
    AnalyseMatches: {},
    LoginServiceAccounts: {},
};
const leagueAndSuperLeagueAdminAccessLevels: IAccessLevels = {
    ...leagueAdminAccessLevels,
    ...superLeagueAdminAccessLevels,
};
const systemAdminAccessLevels: IAccessLevels = {
    ManageAccess: {},
    ManageDivisions: {},
    ManageGames: {},
    ManageNotes: {},
    ManagePlayers: {},
    ManageScores: {},
    ManageSeasons: {},
    ManageTeams: {},
    RunReports: {},
    ExportData: {},
    ImportData: {},
    InputResults: {},
    ViewExceptions: {},
    RecordScoresAsYouGo: {},
    ManageTournaments: {},
    RunHealthChecks: {},
    ManageSeasonTemplates: {},
    ShowDebugOptions: {},
    ManageSockets: {},
    UseWebSockets: {},
    EnterTournamentResults: {},
    UploadPhotos: {},
    ViewAnyPhoto: {},
    DeleteAnyPhoto: {},
    BulkDeleteLeagueFixtures: {},
    ManageFeatures: {},
    AnalyseMatches: {},
    RunDataQueries: {},
    LoginServiceAccounts: {},
};
const superleagueTabletAccessLevels: IAccessLevels = {
    RecordScoresAsYouGo: {},
    ShowDebugOptions: {},
    UseWebSockets: {},
    EnterTournamentResults: {},
    KioskMode: {},
};
const superleagueTvAccessLevels: IAccessLevels = {
    ShowDebugOptions: {},
    UseWebSockets: {},
    KioskMode: {},
};

export const roleMappings: IRole[] = [
    {
        name: 'None',
        accessLevels: {},
    },
    {
        name: 'League admin',
        accessLevels: leagueAdminAccessLevels,
    },
    {
        name: 'Superleague admin',
        accessLevels: superLeagueAdminAccessLevels,
    },
    {
        name: 'League & Superleague admin',
        accessLevels: leagueAndSuperLeagueAdminAccessLevels,
    },
    {
        name: 'System admin',
        accessLevels: systemAdminAccessLevels,
    },
    {
        name: 'Superleague tablet',
        accessLevels: superleagueTabletAccessLevels,
    },
    {
        name: 'Superleague TV',
        accessLevels: superleagueTvAccessLevels,
    },
];
