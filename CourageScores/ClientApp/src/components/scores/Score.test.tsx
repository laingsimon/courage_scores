import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    noop,
    renderApp, TestContext
} from "../../helpers/tests";
import {any, toMap} from "../../helpers/collections";
import {createTemporaryId, repeat} from "../../helpers/projection";
import {Score} from "./Score";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {RecordScoresDto} from "../../interfaces/models/dtos/Game/RecordScoresDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {EditTeamPlayerDto} from "../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {IAppContainerProps} from "../common/AppContainer";
import {GameMatchDto} from "../../interfaces/models/dtos/Game/GameMatchDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {playerBuilder} from "../../helpers/builders/players";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {teamBuilder} from "../../helpers/builders/teams";
import {fixtureBuilder, matchBuilder} from "../../helpers/builders/games";
import {IFailedRequest} from "../common/IFailedRequest";
import {IGameApi} from "../../interfaces/apis/IGameApi";
import {IPlayerApi} from "../../interfaces/apis/IPlayerApi";

interface ICreatedPlayer {
    divisionId: string;
    seasonId: string;
    teamId: string;
    playerDetails: EditTeamPlayerDto;
    newPlayer: TeamPlayerDto;
}

describe('Score', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let fixtureDataMap: { [fixtureId: string]: GameDto } = {};
    let updatedFixtures: { [fixtureId: string]: RecordScoresDto };
    let createdPlayer: ICreatedPlayer;
    let teamsReloaded: boolean;
    let newPlayerApiResult: (createdPlayer: ICreatedPlayer) => IClientActionResultDto<TeamDto>;
    let saveGameApiResult: IClientActionResultDto<GameDto>;
    const gameApi = api<IGameApi>({
        get: async (fixtureId: string) => {
            if (any(Object.keys(fixtureDataMap), (key: string) => key === fixtureId)) {
                return fixtureDataMap[fixtureId];
            }

            throw new Error('Unexpected request for fixture data');
        },
        updateScores: async (fixtureId: string, fixtureData: RecordScoresDto) => {
            updatedFixtures[fixtureId] = fixtureData;
            return saveGameApiResult || {
                success: true,
                messages: ['Fixture updated'],
                result: fixtureData as GameDto,
            }
        }
    });
    const playerApi = api<IPlayerApi>({
        create: async (divisionId: string, seasonId: string, teamId: string, playerDetails: EditTeamPlayerDto) => {
            const newPlayer = Object.assign(playerBuilder().build(), playerDetails);
            createdPlayer = {divisionId, seasonId, teamId, playerDetails, newPlayer};
            if (!newPlayerApiResult) {
                throw new Error('You must set newPlayerApiResult to a factory method instance');
            }
            return newPlayerApiResult(createdPlayer);
        },
    });
    const originalConsoleLog = console.log;

    async function reloadTeams() {
        teamsReloaded = true;
    }

    beforeEach(() => {
        console.log = noop;
        reportedError = new ErrorState();
        updatedFixtures = {};
        createdPlayer = null;
        teamsReloaded = false;
        newPlayerApiResult = null;
        saveGameApiResult = null;
    });

    afterEach(() => {
        cleanUp(context);
        console.log = originalConsoleLog;
    });

    async function renderComponent(id: string, appContainerProps: IAppContainerProps) {
        context = await renderApp(
            iocProps({gameApi, playerApi}),
            brandingProps(),
            appContainerProps,
            (<Score/>),
            '/:fixtureId',
            '/' + id);
    }

    function getDefaultAppData(account?: UserDto): IAppContainerProps {
        const division: DivisionDto = divisionBuilder('A division').build();
        const season: SeasonDto = seasonBuilder('A season')
            .starting('2022-02-03T00:00:00')
            .ending('2022-08-25T00:00:00')
            .withDivision(division)
            .build();
        const homePlayer: TeamPlayerDto = playerBuilder('Home player').build();
        const awayPlayer: TeamPlayerDto = playerBuilder('Away player').build();
        const homeTeam: TeamDto = teamBuilder('Home team', account?.teamId)
            .forSeason(season, division, [ homePlayer ])
            .build();
        const awayTeam: TeamDto = teamBuilder('Away team')
            .forSeason(season, division, [ awayPlayer ])
            .build();

        return appProps({
            divisions: toMap([division]),
            seasons: toMap([season]),
            teams: toMap([homeTeam, awayTeam]),
            account,
            reloadTeams,
        }, reportedError);
    }

    function getUnplayedFixtureData(appData: IAppContainerProps) {
        const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
        const awayTeam = appData.teams.filter(t => t.name === 'Away team')[0];

        return fixtureBuilder('2023-01-02T00:00:00')
            .forSeason(appData.seasons.filter(_ => true)[0])
            .forDivision(appData.divisions.filter(_ => true)[0])
            .playing(homeTeam, awayTeam)
            .updated('2023-01-02T04:05:06')
            .addTo(fixtureDataMap as any)
            .build();
    }

    function getPlayedFixtureData(appData: IAppContainerProps): GameDto {
        const homeTeam: TeamDto = appData.teams.filter((t: TeamDto) => t.name === 'Home team')[0];
        const awayTeam: TeamDto = appData.teams.filter((t: TeamDto) => t.name === 'Away team')[0];

        const firstDivision: DivisionDto = appData.divisions.filter((_: DivisionDto) => true)[0];
        const firstSeason: SeasonDto = appData.seasons.filter((_: SeasonDto) => true)[0];

        function findPlayer(team: TeamDto, name: string): TeamPlayerDto {
            if (!firstSeason || !team || !team.seasons) {
                return { name, id: createTemporaryId() };
            }

            const teamSeason: TeamSeasonDto = team.seasons.filter((s: TeamSeasonDto) => s.seasonId === firstSeason.id)[0];
            const player: TeamPlayerDto = teamSeason.players.filter((p: TeamPlayerDto) => p.name === name)[0];
            return player || { name: name + ' Not found', id: createTemporaryId() };
        }

        function createMatch(homeScore: number, awayScore: number): GameMatchDto {
            return matchBuilder()
                .withHome(findPlayer(homeTeam, 'Home player'))
                .withAway(findPlayer(awayTeam, 'Away player'))
                .scores(homeScore, awayScore)
                .build();
        }

        return fixtureBuilder('2023-01-02T00:00:00')
            .playing({
                    id: homeTeam ? homeTeam.id : createTemporaryId(),
                    name: homeTeam ? homeTeam.name : 'not found',
                    manOfTheMatch: findPlayer(homeTeam, 'Home player').id,
                },
                {
                    id: awayTeam ? awayTeam.id : createTemporaryId(),
                    name: awayTeam ? awayTeam.name : 'not found',
                    manOfTheMatch: findPlayer(awayTeam, 'Away player').id,
                })
            .forSeason(firstSeason ? firstSeason : createTemporaryId())
            .forDivision(firstDivision ? firstDivision : createTemporaryId())
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 0))
            .withMatch(createMatch(3, 0))
            .withMatch(createMatch(3, 0))
            .with180(findPlayer(homeTeam, 'Home player'))
            .withHiCheck(findPlayer(awayTeam, 'Away player'), 140)
            .updated('2023-01-02T04:05:06')
            .addTo(fixtureDataMap as any)
            .build();
    }

    function assertMatchRow(tr: HTMLTableRowElement, ...expectedCellText: string[]) {
        const cellText = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());

        expect(cellText.length).toEqual(expectedCellText.length);

        for (let index = 0; index < cellText.length; index++) {
            const cellTextValue = cellText[index];
            const expectedCellTextValue = expectedCellText[index];

            expect(cellTextValue).toContain(expectedCellTextValue);
        }
    }

    describe('when logged out', () => {
        const account = null;

        it('renders when fixture not found', async () => {
            const fixture = fixtureBuilder().build();
            const appData = getDefaultAppData(account);
            fixtureDataMap[fixture.id] = null;

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('Game could not be found');
        });

        it('renders when fixture data not returned successfully', async () => {
            const fixture = fixtureBuilder().build();
            const appData = getDefaultAppData(account);
            const failedRequest: IFailedRequest = {
                status: 400,
                errors: {'key': ['Some error']}
            };
            fixtureDataMap[fixture.id] = failedRequest as any;

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('Error accessing fixture: Code: 400 -- key: Some error');
        });

        it('renders when home or away are not defined', async () => {
            const fixture = fixtureBuilder().build();
            const appData = getDefaultAppData(account);
            fixtureDataMap[fixture.id] = {
                id: '',
                date: '',
                address: '',
                away: null,
                home: null,
            };

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('Either home or away team are undefined for this game');
        });

        it('renders score card with no results', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getUnplayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const singleRow = tableBody.querySelector('tr td');
            expect(singleRow).toBeTruthy();
            expect(singleRow.textContent).toEqual('No scores, yet');
        });

        it('renders score card with results', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(12);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[2], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[3], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[4], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[5], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[8], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[11], '180sHome player', '', '100+ c/oAway player (140)');
        });

        it('renders when no divisions', async () => {
            const appData = getDefaultAppData(account);
            appData.divisions = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('App has finished loading, no divisions are available');
        });

        it('renders when no seasons', async () => {
            const appData = getDefaultAppData(account);
            appData.seasons = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('App has finished loading, no seasons are available');
        });

        it('renders when no teams', async () => {
            const appData = getDefaultAppData(account);
            appData.teams = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('App has finished loading, no teams are available');
        });
    });

    describe('when logged in', () => {
        const account: UserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                manageScores: true
            },
        };

        it('renders score card without results', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getUnplayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[8], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home playerAdd a player...  Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], 'Select some player/s to add 180s and hi-checks');
        });

        it('renders score card with results', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home player Home playerAdd a player...  Add a player...', '', '', '', 'Away player Away playerAdd a player...  Add a player...');
            assertMatchRow(matchRows[7], 'Home player Home playerAdd a player...  Add a player...', '', '', '', 'Away player Away playerAdd a player...  Add a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home player Home playerAdd a player...  Add a player...  Add a player...', '', '', '', 'Away player Away playerAdd a player...  Add a player...  Add a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], '180s', '', '100+ c/o');
        });

        it('renders when no divisions', async () => {
            const appData = getDefaultAppData(account);
            appData.divisions = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('App has finished loading, no divisions are available');
        });

        it('renders when no seasons', async () => {
            const appData = getDefaultAppData(account);
            appData.seasons = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('App has finished loading, no seasons are available');
        });

        it('renders when no teams', async () => {
            const appData = getDefaultAppData(account);
            appData.teams = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('App has finished loading, no teams are available');
        });

        it('renders when team has no seasons', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            appData.teams = toMap(appData.teams.map(t => {
                if (t.name === 'Home team') {
                    t.seasons = null;
                }
                return t;
            }));

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toEqual('home team has no seasons');
        });

        it('renders when team is not registered to season', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            appData.teams = toMap(appData.teams.map((t: TeamDto) => {
                if (t.name === 'Home team') {
                    t.seasons = [];
                }
                return t;
            }));

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toContain('home team has not registered for this season: ');
        });

        it('renders when team not found', async () => {
            const appData = getDefaultAppData(account);
            appData.teams = toMap(appData.teams.filter((t: TeamDto) => t.name !== 'Home team'));
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            expect(reportedError.error).toContain('home team could not be found - ');
        });

        it('renders previously renamed players', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
            const newHomeTeamPlayer = playerBuilder('New name').captain().build();
            homeTeam.seasons[0].players.push(newHomeTeamPlayer);
            const firstSinglesMatch = fixtureDataMap[fixture.id].matches[0];
            firstSinglesMatch.homePlayers[0] = Object.assign(
                {},
                newHomeTeamPlayer,
                {name: 'Old name'});
            // firstSinglesMatch.sut = true;

            await renderComponent(fixture.id, appData);

            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');
            expect(playerSelection.querySelector('.dropdown-toggle').textContent).toEqual('New name (nee Old name)');
            const selectedPlayer = playerSelection.querySelector('.dropdown-menu .active');
            expect(selectedPlayer).toBeTruthy();
            expect(selectedPlayer.textContent).toEqual('New name (nee Old name)');
        });

        it('can add a player to home team', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);
            newPlayerApiResult = (createdPlayer) => {
                const existingTeam = Object.assign({}, appData.teams[createdPlayer.teamId]);
                existingTeam.seasons = existingTeam.seasons.map((ts: TeamSeasonDto) => {
                    const newTeamSeason = Object.assign({}, ts);

                    if (ts.seasonId === createdPlayer.seasonId) {
                        newTeamSeason.players = newTeamSeason.players.concat([
                            createdPlayer.newPlayer
                        ]);
                    }

                    return newTeamSeason;
                });

                return {
                    success: true,
                    result: existingTeam,
                };
            };

            reportedError.verifyNoError();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');
            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Create home player...');
            await doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER', context.user);
            await doClick(findButton(addPlayerDialog, 'Add player'));

            reportedError.verifyNoError();
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can handle missing team season during add new player', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);
            newPlayerApiResult = (createdPlayer) => {
                const existingTeam = Object.assign({}, appData.teams[createdPlayer.teamId]);
                existingTeam.seasons = existingTeam.seasons.filter((_: TeamSeasonDto) => false); // return no team seasons

                return {
                    success: true,
                    result: existingTeam,
                };
            };

            reportedError.verifyNoError();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');
            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Create home player...');
            await doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER', context.user);
            await doClick(findButton(addPlayerDialog, 'Add player'));

            expect(reportedError.error).toEqual('Could not find updated teamSeason');
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can handle new player not found after creating new player', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);
            newPlayerApiResult = (createdPlayer) => {
                const existingTeam = Object.assign({}, appData.teams[createdPlayer.teamId]);
                existingTeam.seasons = existingTeam.seasons.map((ts: TeamSeasonDto) => {
                    return Object.assign({}, ts);
                });

                return {
                    success: true,
                    result: existingTeam,
                };
            };

            reportedError.verifyNoError();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');
            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Create home player...');
            await doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER', context.user);
            await doClick(findButton(addPlayerDialog, 'Add player'));

            expect(reportedError.error).toEqual('Could not find new player in updated season, looking for player with name: "NEW PLAYER"');
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can add a player to away team', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(5)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');

            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Create away player...');
        });

        it('can close add player dialog', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);
            reportedError.verifyNoError();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(5)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Cancel'));

            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeFalsy();
        });

        it('can save scores', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);

            await doClick(findButton(context.container, 'Save'));

            reportedError.verifyNoError();
            expect(updatedFixtures[fixture.id]).not.toBeNull();
            expect(updatedFixtures[fixture.id].lastUpdated).toEqual(fixture.updated);
        });

        it('renders error if save fails', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);
            saveGameApiResult = {
                success: false,
            };

            await doClick(findButton(context.container, 'Save'));

            expect(context.container.textContent).toContain('Could not save score');
        });

        it('can change player', async () => {
            const appData = getDefaultAppData(account);
            const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
            const anotherHomePlayer = playerBuilder('Another player').build();
            homeTeam.seasons[0].players.push(anotherHomePlayer);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');

            await doClick(findButton(playerSelection, 'Another player'));
            await doClick(findButton(context.container, 'Save'));

            reportedError.verifyNoError();
            expect(updatedFixtures[fixture.id]).not.toBeNull();
            expect(updatedFixtures[fixture.id].lastUpdated).toEqual(fixture.updated);
            expect(updatedFixtures[fixture.id].matches[0].homePlayers).toEqual([anotherHomePlayer]);
        });

        it('can change match options', async () => {
            const appData = getDefaultAppData(account);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(5)');

            await doClick(findButton(playerSelection, '🛠'));
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doChange(dialog, 'input[name="numberOfLegs"]', '30', context.user);
            await doClick(findButton(dialog, 'Close'));
            await doClick(findButton(context.container, 'Save'));

            reportedError.verifyNoError();
            expect(updatedFixtures[fixture.id]).not.toBeNull();
            expect(updatedFixtures[fixture.id].lastUpdated).toEqual(fixture.updated);
            expect(updatedFixtures[fixture.id].matchOptions[0].numberOfLegs).toEqual(30);
        });

        it('can unpublish unselected submission', async () => {
            const appData = getDefaultAppData(account);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            await renderComponent(fixtureData.id, appData);
            reportedError.verifyNoError();
            let alert: string;
            window.alert = (msg) => alert = msg;

            await doClick(findButton(context.container, 'Unpublish'));

            reportedError.verifyNoError();
            expect(alert).toEqual('Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved');
            const matches = Array.from(context.container.querySelectorAll('table tbody tr'));
            const allScores = matches.flatMap(match => {
                const tds = Array.from(match.querySelectorAll('td')).filter(td => td.colSpan !== 2);
                return Array.from(tds.flatMap(td => Array.from(td.querySelectorAll('input'))));
            });
            expect(allScores.map(input => input.value)).toEqual(repeat(16, _ => '')); // 16 = 8 matches * 2 sides
            const manOfTheMatchHeadingRow = Array.from(context.container.querySelectorAll('td')).filter(td => td.textContent === 'Man of the match')[0];
            const manOfTheMatchDataRow = manOfTheMatchHeadingRow.parentElement.nextSibling as HTMLTableRowElement;
            expect(manOfTheMatchDataRow.querySelector('td:nth-child(1) .dropdown-toggle').textContent).toEqual(' ');
            expect(manOfTheMatchDataRow.querySelector('td:nth-child(3) .dropdown-toggle').textContent).toEqual(' ');
            const oneEightiesRow = context.container.querySelector('tr[datatype="merge-180s"] td:nth-child(1)');
            const hiChecksRow = context.container.querySelector('tr[datatype="merge-hichecks"] td:nth-child(3)');
            expect(oneEightiesRow.querySelectorAll('button').length).toEqual(1); // merge button
            expect(hiChecksRow.querySelectorAll('button').length).toEqual(1); // merge button
        });

        it('can unpublish home submission', async () => {
            const appData = getDefaultAppData(account);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            fixtureData.homeSubmission.matches.forEach(match => {
                match.homeScore = 1;
                match.awayScore = 1;
            });
            await renderComponent(fixtureData.id, appData);
            reportedError.verifyNoError();
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container, 'span[title="See home submission"]');
            reportedError.verifyNoError();

            await doClick(findButton(context.container, 'Unpublish'));

            reportedError.verifyNoError();
            expect(alert).toEqual('Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved');
            const matches = Array.from(context.container.querySelectorAll('table tbody tr'));
            const allScores = matches.flatMap(match => {
                const tds = Array.from(match.querySelectorAll('td')).filter(td => td.colSpan !== 2);
                return Array.from(tds.flatMap(td => Array.from(td.querySelectorAll('strong')))).map(str => str.textContent);
            });
            expect(allScores).toEqual(repeat(16, _ => '1')); // 16 = 8 matches * 2 sides
        });

        it('can unpublish away submission', async () => {
            const appData = getDefaultAppData(account);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission.matches.forEach(match => {
                match.homeScore = 2;
                match.awayScore = 2;
            });
            await renderComponent(fixtureData.id, appData);
            reportedError.verifyNoError();
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container, 'span[title="See away submission"]');
            reportedError.verifyNoError();

            await doClick(findButton(context.container, 'Unpublish'));

            reportedError.verifyNoError();
            expect(alert).toEqual('Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved');
            const matches = Array.from(context.container.querySelectorAll('table tbody tr'));
            const allScores = matches.flatMap(match => {
                const tds = Array.from(match.querySelectorAll('td')).filter(td => td.colSpan !== 2);
                return Array.from(tds.flatMap(td => Array.from(td.querySelectorAll('strong')))).map(str => str.textContent);
            });
            expect(allScores).toEqual(repeat(16, _ => '2')); // 16 = 8 matches * 2 sides
        });

        it('can show when only home submission present', async () => {
            const appData = getDefaultAppData(account);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = null;
            fixtureData.homeSubmission.matches.forEach(match => {
                match.homeScore = 1;
                match.awayScore = 1;
            });
            fixtureData.homeSubmission.away.manOfTheMatch = null;
            fixtureData.home.manOfTheMatch = null;
            fixtureData.away.manOfTheMatch = null;

            await renderComponent(fixtureData.id, appData);

            reportedError.verifyNoError();
        });

        it('can show when only away submission present', async () => {
            const appData = getDefaultAppData(account);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            fixtureData.homeSubmission = null;
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission.matches.forEach(match => {
                match.homeScore = 1;
                match.awayScore = 1;
            });
            fixtureData.awaySubmission.home.manOfTheMatch = null;
            fixtureData.home.manOfTheMatch = null;
            fixtureData.away.manOfTheMatch = null;

            await renderComponent(fixtureData.id, appData);

            reportedError.verifyNoError();
        });
    });

    describe('when logged in as a home clerk', () => {
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                manageScores: false,
                inputResults: true,
            },
            teamId: createTemporaryId(),
        };
        const appData = getDefaultAppData(account);
        const fixture = getUnplayedFixtureData(appData);

        it('renders score card without results', async () => {
            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[8], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home playerAdd a player...  Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], 'Select some player/s to add 180s and hi-checks');
        });

        it('renders published score card', async () => {
            fixture.resultsPublished = true;

            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(12);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], '', '', '', '', '');
            assertMatchRow(matchRows[2], '', '', '', '', '');
            assertMatchRow(matchRows[3], '', '', '', '', '');
            assertMatchRow(matchRows[4], '', '', '', '', '');
            assertMatchRow(matchRows[5], '', '', '', '', '');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], '', '', '', '', '');
            assertMatchRow(matchRows[8], '', '', '', '', '');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], '', '', '', '', '');
            assertMatchRow(matchRows[11], '');
        });
    });

    describe('when logged in as an away clerk', () => {
        const account: UserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                manageScores: false,
                inputResults: true,
            },
            teamId: createTemporaryId(),
        };
        const appData = getDefaultAppData(account);
        const fixture = getUnplayedFixtureData(appData);

        it('renders score card without results', async () => {
            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[8], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home playerAdd a player...  Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], 'Select some player/s to add 180s and hi-checks');
        });

        it('renders published score card', async () => {
            fixture.resultsPublished = true;

            await renderComponent(fixture.id, appData);

            reportedError.verifyNoError();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(12);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], '', '', '', '', '');
            assertMatchRow(matchRows[2], '', '', '', '', '');
            assertMatchRow(matchRows[3], '', '', '', '', '');
            assertMatchRow(matchRows[4], '', '', '', '', '');
            assertMatchRow(matchRows[5], '', '', '', '', '');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], '', '', '', '', '');
            assertMatchRow(matchRows[8], '', '', '', '', '');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], '', '', '', '', '');
            assertMatchRow(matchRows[11], '');
        });
    });
});