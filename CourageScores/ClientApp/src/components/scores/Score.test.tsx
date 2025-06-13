import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
    iocProps,
    noop,
    renderApp,
    setFile,
    TestContext,
    user,
} from '../../helpers/tests';
import { any, take } from '../../helpers/collections';
import { createTemporaryId, repeat } from '../../helpers/projection';
import { Score } from './Score';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { RecordScoresDto } from '../../interfaces/models/dtos/Game/RecordScoresDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { EditTeamPlayerDto } from '../../interfaces/models/dtos/Team/EditTeamPlayerDto';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { IAppContainerProps } from '../common/AppContainer';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { playerBuilder } from '../../helpers/builders/players';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { teamBuilder } from '../../helpers/builders/teams';
import { fixtureBuilder } from '../../helpers/builders/games';
import { IFailedRequest } from '../common/IFailedRequest';
import { IGameApi } from '../../interfaces/apis/IGameApi';
import { IPlayerApi } from '../../interfaces/apis/IPlayerApi';
import { UploadPhotoDto } from '../../interfaces/models/dtos/UploadPhotoDto';
import { PhotoReferenceDto } from '../../interfaces/models/dtos/PhotoReferenceDto';
import { IFeatureApi } from '../../interfaces/apis/IFeatureApi';
import { ConfiguredFeatureDto } from '../../interfaces/models/dtos/ConfiguredFeatureDto';
import { IDatedDivisionFixtureDto } from '../division_fixtures/IDatedDivisionFixtureDto';
import { TeamSeasonDto } from '../../interfaces/models/dtos/Team/TeamSeasonDto';

interface ICreatedPlayer {
    divisionId: string;
    seasonId: string;
    teamId: string;
    playerDetails: EditTeamPlayerDto;
    newPlayer: TeamPlayerDto;
}

type FixtureData = IDatedDivisionFixtureDto & GameDto;
type EditPlayer = EditTeamPlayerDto;

describe('Score', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let fixtureDataMap: {
        [fixtureId: string]: FixtureData;
    } = {};
    let updatedFixtures: { [fixtureId: string]: RecordScoresDto };
    let createdPlayer: ICreatedPlayer | null;
    let teamsReloaded: boolean;
    let newPlayerApiResult:
        | ((createdPlayer: ICreatedPlayer) => IClientActionResultDto<TeamDto>)
        | null;
    let saveGameApiResult: IClientActionResultDto<GameDto> | null;
    let uploadedPhoto: { request: UploadPhotoDto; file: File } | null;
    let uploadPhotoResponse: IClientActionResultDto<GameDto> | null;
    let deletedPhoto: { id: string; photoId: string } | null;
    let deletePhotoResponse: IClientActionResultDto<GameDto> | null;
    const gameApi = api<IGameApi>({
        get: async (id: string) => {
            if (any(Object.keys(fixtureDataMap), (key: string) => key === id)) {
                return fixtureDataMap[id];
            }

            throw new Error('Unexpected request for fixture data');
        },
        updateScores: async (id: string, data: RecordScoresDto) => {
            updatedFixtures[id] = data;
            return (
                saveGameApiResult || {
                    success: true,
                    messages: ['Fixture updated'],
                    result: data as GameDto,
                }
            );
        },
        async uploadPhoto(r: UploadPhotoDto, f: File) {
            uploadedPhoto = { request: r, file: f };
            return uploadPhotoResponse!;
        },
        async deletePhoto(id: string, photoId: string) {
            deletedPhoto = { id, photoId };
            return deletePhotoResponse!;
        },
    });
    const playerApi = api<IPlayerApi>({
        create: async (d: string, s: string, t: string, p: EditPlayer) => {
            createdPlayer = {
                divisionId: d,
                seasonId: s,
                teamId: t,
                playerDetails: p,
                newPlayer: Object.assign(playerBuilder().build(), p),
            };
            if (!newPlayerApiResult) {
                throw new Error(
                    'You must set newPlayerApiResult to a factory method instance',
                );
            }
            return newPlayerApiResult(createdPlayer);
        },
    });
    const featureApi = api<IFeatureApi>({
        async getFeatures(): Promise<ConfiguredFeatureDto[]> {
            const feature = {
                name: 'PhotosEnabled',
                configuredValue: 'true',
                id: 'af2ef520-8153-42b0-9ef4-d8419daebc23',
                description: '',
            };
            return [feature];
        },
    });
    const addAPlayer = 'Add a player...';
    const nbsp = ' ';
    const nbspx2 = nbsp + nbsp;
    const nbsbAddAPlayer = nbsp + addAPlayer;
    const homePlayer = 'Home player';
    const homePlayerAdd = homePlayer + addAPlayer;
    const awayPlayer = 'Away player';
    const awayPlayerAdd = awayPlayer + addAPlayer;
    const addHomePairs = homePlayerAdd + nbspx2 + homePlayerAdd;
    const addAwayPairs = awayPlayerAdd + nbspx2 + awayPlayerAdd;
    const addHomeTriples =
        homePlayerAdd + nbspx2 + homePlayerAdd + nbspx2 + homePlayerAdd;
    const addAwayTriples =
        awayPlayerAdd + nbspx2 + awayPlayerAdd + nbspx2 + awayPlayerAdd;
    const selectPlayers = 'Select some player/s to add 180s and hi-checks';

    function join(...values: string[]) {
        return values.join(nbsp);
    }

    async function reloadTeams() {
        teamsReloaded = true;
    }

    function assertEmptyScoreCard() {
        const container = contentBackground()!;
        const tableBody = container.querySelector('table tbody')!;
        const rows = tableBody.querySelectorAll('tr');
        expect(rows.length).toEqual(12);
        assertRow(rows[0], 'Singles');
        assertRow(rows[1], '', '', '', '', '');
        assertRow(rows[2], '', '', '', '', '');
        assertRow(rows[3], '', '', '', '', '');
        assertRow(rows[4], '', '', '', '', '');
        assertRow(rows[5], '', '', '', '', '');
        assertRow(rows[6], 'Pairs');
        assertRow(rows[7], '', '', '', '', '');
        assertRow(rows[8], '', '', '', '', '');
        assertRow(rows[9], 'Triples');
        assertRow(rows[10], '', '', '', '', '');
        assertRow(rows[11], '');
    }

    function assertScoreCardForClerk() {
        const container = contentBackground()!;
        const tableBody = container.querySelector('table tbody')!;
        const rows = tableBody.querySelectorAll('tr');
        expect(rows.length).toEqual(14);
        assertRow(rows[0], 'Singles');
        assertRow(rows[1], homePlayer, '', '', '', awayPlayer);
        assertRow(rows[2], homePlayer, '', '', '', awayPlayer);
        assertRow(rows[3], homePlayer, '', '', '', awayPlayer);
        assertRow(rows[4], homePlayer, '', '', '', awayPlayer);
        assertRow(rows[5], homePlayer, '', '', '', awayPlayer);
        assertRow(rows[6], 'Pairs');
        assertRow(rows[7], addHomePairs, '', '', '', addAwayPairs);
        assertRow(rows[8], addHomePairs, '', '', '', addAwayPairs);
        assertRow(rows[9], 'Triples');
        assertRow(rows[10], addHomeTriples, '', '', '', addAwayTriples);
        assertRow(rows[11], 'Man of the match');
        assertRow(rows[12], '', '', '');
        assertRow(rows[13], selectPlayers);
    }

    beforeEach(() => {
        console.log = noop;
        reportedError = new ErrorState();
        updatedFixtures = {};
        createdPlayer = null;
        teamsReloaded = false;
        newPlayerApiResult = null;
        saveGameApiResult = null;
        uploadedPhoto = null;
        uploadPhotoResponse = null;
        deletedPhoto = null;
        deletePhotoResponse = null;
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    function dialog() {
        return context.container.querySelector('.modal-dialog');
    }

    async function renderComponent(id: string, props: IAppContainerProps) {
        context = await renderApp(
            iocProps({ gameApi, playerApi, featureApi }),
            brandingProps(),
            props,
            <Score />,
            '/:fixtureId',
            '/' + id,
        );
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
            .forSeason(season, division, [homePlayer])
            .build();
        const awayTeam: TeamDto = teamBuilder('Away team')
            .forSeason(season, division, [awayPlayer])
            .build();

        return appProps(
            {
                divisions: [division],
                seasons: [season],
                teams: [homeTeam, awayTeam],
                account,
                reloadTeams,
            },
            reportedError,
        );
    }

    function getUnplayedFixtureData(appData: IAppContainerProps): GameDto {
        const homeTeam = appData.teams.find((t) => t.name === 'Home team')!;
        const awayTeam = appData.teams.find((t) => t.name === 'Away team')!;

        return fixtureBuilder('2023-01-02T00:00:00')
            .forSeason(appData.seasons[0])
            .forDivision(appData.divisions[0])
            .teams(homeTeam, awayTeam)
            .updated('2023-01-02T04:05:06')
            .addTo(fixtureDataMap)
            .build();
    }

    function getPlayedFixtureData(appData: IAppContainerProps): GameDto {
        const homeTeam = appData.teams.find((t) => t.name === 'Home team')!;
        const awayTeam = appData.teams.find((t) => t.name === 'Away team')!;

        const firstDivision: DivisionDto = appData.divisions[0];
        const firstSeason: SeasonDto = appData.seasons[0];

        function findPlayer(team: TeamDto, name: string): TeamPlayerDto {
            if (!firstSeason || !team || !team.seasons) {
                return { name, id: createTemporaryId() };
            }

            const teamSeason = team.seasons.find(
                (ts) => ts.seasonId === firstSeason.id && !ts.deleted,
            )!;
            const player = teamSeason.players!.find((p) => p.name === name);
            return (
                player || { name: name + ' Not found', id: createTemporaryId() }
            );
        }

        function createMatch(home: number, away: number) {
            return (b) =>
                b
                    .withHome(findPlayer(homeTeam, 'Home player'))
                    .withAway(findPlayer(awayTeam, 'Away player'))
                    .scores(home, away);
        }

        return fixtureBuilder('2023-01-02T00:00:00')
            .teams(
                {
                    id: homeTeam ? homeTeam.id : createTemporaryId(),
                    name: homeTeam ? homeTeam.name : 'not found',
                    manOfTheMatch: findPlayer(homeTeam, 'Home player').id,
                },
                {
                    id: awayTeam ? awayTeam.id : createTemporaryId(),
                    name: awayTeam ? awayTeam.name : 'not found',
                    manOfTheMatch: findPlayer(awayTeam, 'Away player').id,
                },
            )
            .forSeason(firstSeason ? firstSeason : seasonBuilder().build())
            .forDivision(
                firstDivision
                    ? firstDivision
                    : divisionBuilder('DIVISION').build(),
            )
            .withMatch(createMatch(3, 2), createMatch(3, 2)) // first 2 singles
            .withMatch(createMatch(3, 2), createMatch(3, 2)) // second 2 singles
            .withMatch(createMatch(3, 2)) // final singles
            .withMatch(createMatch(3, 0), createMatch(3, 0)) // pairs
            .withMatch(createMatch(3, 0)) // triples
            .with180(findPlayer(homeTeam, 'Home player'))
            .withHiCheck(findPlayer(awayTeam, 'Away player'), 140)
            .updated('2023-01-02T04:05:06')
            .addTo(fixtureDataMap)
            .build();
    }

    function assertRow(tr: HTMLTableRowElement, ...expectedCellText: string[]) {
        const cellText = Array.from(tr.querySelectorAll('td')).map((td) =>
            td.textContent!.trim(),
        );

        expect(cellText.length).toEqual(expectedCellText.length);

        for (let index = 0; index < cellText.length; index++) {
            expect(cellText[index]).toContain(expectedCellText[index]);
        }
    }

    function contentBackground() {
        return context.container.querySelector('.content-background');
    }

    function matchRow(matchNo: number = 1) {
        const selector = `.content-background table tbody tr:nth-child(${matchNo + 1})`;
        return context.container.querySelector(selector);
    }

    async function selectPlayer(name: string, m: number, s: 'home' | 'away') {
        const col = s === 'home' ? 1 : 5;
        const players = matchRow(m)!.querySelector(`td:nth-child(${col})`)!;
        await doSelectOption(players.querySelector('.dropdown-menu')!, name);
    }

    function assertError(message: string) {
        expect(reportedError.error).toContain(message);
    }

    describe('when logged out', () => {
        const account: UserDto | undefined = undefined;
        let fixture: GameDto;
        let appData: IAppContainerProps;

        beforeEach(() => {
            fixture = fixtureBuilder().build();
            appData = getDefaultAppData(account);
        });

        it('renders when fixture not found', async () => {
            fixtureDataMap[fixture.id] = null!;

            await renderComponent(fixture.id, appData);

            assertError('Game could not be found');
        });

        it('renders when fixture data not returned successfully', async () => {
            const failedRequest: IFailedRequest = {
                status: 400,
                errors: { key: ['Some error'] },
            };
            fixtureDataMap[fixture.id] = failedRequest as FixtureData;

            await renderComponent(fixture.id, appData);

            assertError(
                'Error accessing fixture: Code: 400 -- key: Some error',
            );
        });

        it('renders when home or away are not defined', async () => {
            fixtureDataMap[fixture.id] = {} as FixtureData;

            await renderComponent(fixture.id, appData);

            assertError('Either home or away team are undefined for this game');
        });

        it('renders score card with no results', async () => {
            fixture = getUnplayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            const container = contentBackground()!;
            const singleRow = container.querySelector('table tbody tr td')!;
            expect(singleRow.textContent).toEqual('No scores, yet');
        });

        it('renders score card with results', async () => {
            fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            const container = contentBackground()!;
            const tableBody = container.querySelector('table tbody')!;
            const rows = Array.from(tableBody.querySelectorAll('tr'));
            expect(rows.length).toEqual(12);
            assertRow(rows[0], 'Singles');
            assertRow(rows[1], 'Home player', '3', '', '2', 'Away player');
            assertRow(rows[2], 'Home player', '3', '', '2', 'Away player');
            assertRow(rows[3], 'Home player', '3', '', '2', 'Away player');
            assertRow(rows[4], 'Home player', '3', '', '2', 'Away player');
            assertRow(rows[5], 'Home player', '3', '', '2', 'Away player');
            assertRow(rows[6], 'Pairs');
            assertRow(rows[7], 'Home player', '3', '', '0', 'Away player');
            assertRow(rows[8], 'Home player', '3', '', '0', 'Away player');
            assertRow(rows[9], 'Triples');
            assertRow(rows[10], 'Home player', '3', '', '0', 'Away player');
            assertRow(
                rows[11],
                '180sHome player',
                '',
                '100+ c/oAway player (140)',
            );
        });

        it('renders when no divisions', async () => {
            appData.divisions = [];
            fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            assertError('App has finished loading, no divisions are available');
        });

        it('renders when no seasons', async () => {
            appData.seasons = [];
            fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            assertError('App has finished loading, no seasons are available');
        });

        it('renders when no teams', async () => {
            appData.teams = [];
            fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            assertError('App has finished loading, no teams are available');
        });
    });

    describe('when logged in', () => {
        const account = user({ manageScores: true });
        let appData: IAppContainerProps;
        let fixture: GameDto;

        function addPlayerToSeason(ts: TeamSeasonDto, player: ICreatedPlayer) {
            if (ts.seasonId === player.seasonId) {
                ts.players = (ts.players ?? []).concat(player.newPlayer);
            }

            return ts;
        }

        function modifySeasonOnAdd(
            modify: (ts: TeamSeasonDto, p: ICreatedPlayer) => TeamSeasonDto,
            truncate?: boolean,
        ) {
            return (player: ICreatedPlayer) => {
                const team = appData.teams.find((t) => t.id === player.teamId)!;
                const newTeam: TeamDto = {
                    ...team,
                    seasons: team
                        .seasons!.map((ts) => {
                            const newTs = { ...ts };
                            return modify(newTs, player);
                        })
                        .filter(() => truncate !== true),
                };

                return {
                    success: true,
                    result: newTeam,
                };
            };
        }

        function getScores(
            tagName: string,
            selector: (e: Element) => string,
        ): string[] {
            const matches = Array.from(
                context.container.querySelectorAll('table tbody tr'),
            );
            return matches.flatMap((match) => {
                const tds = Array.from(match.querySelectorAll('td')).filter(
                    (td) => td.colSpan !== 2,
                );
                return Array.from(
                    tds.flatMap((td) =>
                        Array.from(td.querySelectorAll(tagName)).map(selector),
                    ),
                );
            });
        }

        beforeEach(() => {
            appData = getDefaultAppData(account);
            fixture = getPlayedFixtureData(appData);
        });

        it('renders score card without results', async () => {
            fixture = getUnplayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            assertScoreCardForClerk();
        });

        it('renders score card with results', async () => {
            await renderComponent(fixture.id, appData);

            const container = contentBackground()!;
            const tableBody = container.querySelector('table tbody')!;
            const rows = tableBody.querySelectorAll('tr');
            expect(rows.length).toEqual(14);
            assertRow(rows[0], 'Singles');
            assertRow(rows[1], homePlayer, '', '', '', awayPlayer);
            assertRow(rows[2], homePlayer, '', '', '', awayPlayer);
            assertRow(rows[3], homePlayer, '', '', '', awayPlayer);
            assertRow(rows[4], homePlayer, '', '', '', awayPlayer);
            assertRow(rows[5], homePlayer, '', '', '', awayPlayer);
            assertRow(rows[6], 'Pairs');
            assertRow(
                rows[7],
                join(homePlayer, homePlayerAdd, nbsbAddAPlayer),
                '',
                '',
                '',
                join(awayPlayer, awayPlayerAdd, nbsbAddAPlayer),
            );
            assertRow(
                rows[8],
                join(homePlayer, homePlayerAdd, nbsbAddAPlayer),
                '',
                '',
                '',
                join(awayPlayer, awayPlayerAdd, nbsbAddAPlayer),
            );
            assertRow(rows[9], 'Triples');
            assertRow(
                rows[10],
                join(homePlayer, homePlayerAdd, nbsbAddAPlayer, nbsbAddAPlayer),
                '',
                '',
                '',
                join(awayPlayer, awayPlayerAdd, nbsbAddAPlayer, nbsbAddAPlayer),
            );
            assertRow(rows[11], 'Man of the match');
            assertRow(rows[12], '', '', '');
            assertRow(rows[13], '180s', '', '100+ c/o');
        });

        it('renders when no divisions', async () => {
            appData.divisions = [];
            fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            assertError('App has finished loading, no divisions are available');
        });

        it('renders when no seasons', async () => {
            appData.seasons = [];
            fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            assertError('App has finished loading, no seasons are available');
        });

        it('renders when no teams', async () => {
            appData.teams = [];
            fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            assertError('App has finished loading, no teams are available');
        });

        it('renders when team has no seasons', async () => {
            appData.teams = appData.teams.map((t) => {
                if (t.name === 'Home team') {
                    t.seasons = undefined;
                }
                return t;
            });

            await renderComponent(fixture.id, appData);

            assertError('home team has no seasons');
        });

        it('renders when team is not registered to season', async () => {
            appData.teams = appData.teams.map((t: TeamDto) => {
                if (t.name === 'Home team') {
                    t.seasons = [];
                }
                return t;
            });

            await renderComponent(fixture.id, appData);

            assertError('home team has not registered for this season: ');
        });

        it('renders when team not found', async () => {
            appData.teams = appData.teams.filter(
                (t: TeamDto) => t.name !== 'Home team',
            );
            fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData);

            assertError('home team could not be found - ');
        });

        it('renders previously renamed players', async () => {
            const homeTeam = appData.teams.find((t) => t.name === 'Home team')!;
            const newPlayer = playerBuilder('New name').captain().build();
            homeTeam.seasons![0].players!.push(newPlayer);
            const firstSinglesMatch = fixtureDataMap[fixture.id]!.matches![0];
            firstSinglesMatch.homePlayers![0] = Object.assign({}, newPlayer, {
                name: 'Old name',
            });

            await renderComponent(fixture.id, appData);

            const players = matchRow(1)!.querySelector('td:nth-child(1)')!;
            const toggle = players.querySelector('.dropdown-toggle')!;
            expect(toggle.textContent).toEqual('New name (nee Old name)');
            const item = players.querySelector('.dropdown-menu .active')!;
            expect(item.textContent).toEqual('New name (nee Old name)');
        });

        it('can add a player to home team', async () => {
            await renderComponent(fixture.id, appData);
            newPlayerApiResult = modifySeasonOnAdd(addPlayerToSeason);

            await selectPlayer(addAPlayer, 1, 'home');
            expect(dialog()!.textContent).toContain('Create home player...');
            await doChange(
                dialog()!,
                'input[name="name"]',
                'NEW PLAYER',
                context.user,
            );
            await doClick(findButton(dialog(), 'Add player'));

            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(dialog()).toBeFalsy();
        });

        it('can add multiple players to home team', async () => {
            await renderComponent(fixture.id, appData);
            newPlayerApiResult = modifySeasonOnAdd(addPlayerToSeason);

            await selectPlayer(addAPlayer, 1, 'home');
            expect(dialog()!.textContent).toContain('Create home player...');
            await doClick(dialog()!, 'input[name="multiple"]');
            await doChange(
                dialog()!,
                'textarea[name="name"]',
                'NEW PLAYER 1\nNEW PLAYER 2',
                context.user,
            );
            await doClick(findButton(dialog(), 'Add players'));

            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(dialog()).toBeFalsy();
        });

        it('can handle missing team season during add new player', async () => {
            await renderComponent(fixture.id, appData);
            newPlayerApiResult = modifySeasonOnAdd((t) => t, true);

            await selectPlayer(addAPlayer, 1, 'home');
            expect(dialog()!.textContent).toContain('Create home player...');
            await doChange(
                dialog()!,
                'input[name="name"]',
                'NEW PLAYER',
                context.user,
            );
            await doClick(findButton(dialog(), 'Add player'));

            assertError('Could not find updated teamSeason');
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(dialog()).toBeFalsy();
        });

        it('can handle deleted team season during add new player', async () => {
            await renderComponent(fixture.id, appData);
            newPlayerApiResult = modifySeasonOnAdd((ts) => {
                ts.deleted = '2020-01-02T04:05:06Z'; // modify the team season so it is deleted
                return ts;
            });

            await selectPlayer(addAPlayer, 1, 'home');
            expect(dialog()!.textContent).toContain('Create home player...');
            await doChange(
                dialog()!,
                'input[name="name"]',
                'NEW PLAYER',
                context.user,
            );
            await doClick(findButton(dialog(), 'Add player'));

            assertError('Could not find updated teamSeason');
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(dialog()).toBeFalsy();
        });

        it('can handle new player not found after creating new player', async () => {
            await renderComponent(fixture.id, appData);
            newPlayerApiResult = modifySeasonOnAdd((ts) => ts);

            await selectPlayer(addAPlayer, 1, 'home');
            expect(dialog()!.textContent).toContain('Create home player...');
            await doChange(
                dialog()!,
                'input[name="name"]',
                'NEW PLAYER',
                context.user,
            );
            await doClick(findButton(dialog(), 'Add player'));

            assertError(
                'Could not find new player in updated season, looking for player with name: "NEW PLAYER"',
            );
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(dialog()).toBeFalsy();
        });

        it('can add a player to away team', async () => {
            await renderComponent(fixture.id, appData);

            await selectPlayer(addAPlayer, 1, 'away');

            expect(dialog()!.textContent).toContain('Create away player...');
        });

        it('can close add player dialog', async () => {
            await renderComponent(fixture.id, appData);
            await selectPlayer(addAPlayer, 1, 'away');

            await doClick(findButton(dialog()!, 'Cancel'));

            expect(dialog()).toBeFalsy();
        });

        it('can save scores', async () => {
            await renderComponent(fixture.id, appData);

            await doClick(findButton(context.container, 'Save'));

            const updatedFixture = updatedFixtures[fixture.id];
            expect(updatedFixture.lastUpdated).toEqual(fixture.updated);
        });

        it('renders error if save fails', async () => {
            await renderComponent(fixture.id, appData);
            saveGameApiResult = {
                success: false,
            };

            await doClick(findButton(context.container, 'Save'));

            const textContent = context.container.textContent;
            expect(textContent).toContain('Could not save score');
        });

        it('can change player', async () => {
            const homeTeam = appData.teams.find((t) => t.name === 'Home team')!;
            const anotherHomePlayer = playerBuilder('Another player').build();
            homeTeam.seasons![0].players!.push(anotherHomePlayer);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData);

            await selectPlayer('Another player', 1, 'home');
            await doClick(findButton(context.container, 'Save'));

            const updatedFixture = updatedFixtures[fixture.id];
            expect(updatedFixture.lastUpdated).toEqual(fixture.updated);
            const homePlayers = updatedFixture.matches![0].homePlayers;
            expect(homePlayers).toEqual([anotherHomePlayer]);
        });

        it('can change match options', async () => {
            await renderComponent(fixture.id, appData);
            const players = matchRow(1)!.querySelector('td:nth-child(5)')!;

            await doClick(findButton(players, '🛠'));
            await doChange(
                dialog()!,
                'input[name="numberOfLegs"]',
                '30',
                context.user,
            );
            await doClick(findButton(dialog(), 'Close'));
            await doClick(findButton(context.container, 'Save'));

            const updatedFixture = updatedFixtures[fixture.id];
            expect(updatedFixture.lastUpdated).toEqual(fixture.updated);
            expect(updatedFixture.matchOptions![0].numberOfLegs).toEqual(30);
        });

        it('can unpublish unselected submission', async () => {
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            await renderComponent(fixtureData.id, appData);

            await doClick(findButton(context.container, 'Unpublish'));

            context.prompts.alertWasShown(
                'Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved',
            );
            const scores = getScores(
                'input',
                (i) => (i as HTMLInputElement).value,
            );
            expect(scores).toEqual(repeat(16, (_) => '')); // 16 = 8 matches * 2 sides
            const manOfTheMatchHeadingRow = Array.from(
                context.container.querySelectorAll('td'),
            ).find((td) => td.textContent === 'Man of the match')!;
            const motm = manOfTheMatchHeadingRow.parentElement!
                .nextSibling as HTMLTableRowElement;
            expect(
                motm.querySelector('td:nth-child(1) .dropdown-toggle')!
                    .textContent,
            ).toEqual(nbsp);
            expect(
                motm.querySelector('td:nth-child(3) .dropdown-toggle')!
                    .textContent,
            ).toEqual(nbsp);
            const oneEightiesRow = context.container.querySelector(
                'tr[datatype="merge-180s"] td:nth-child(1)',
            )!;
            const hiChecksRow = context.container.querySelector(
                'tr[datatype="merge-hichecks"] td:nth-child(3)',
            )!;
            expect(oneEightiesRow.querySelectorAll('button').length).toEqual(1); // merge button
            expect(hiChecksRow.querySelectorAll('button').length).toEqual(1); // merge button
        });

        it('can unpublish home submission', async () => {
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            for (const match of fixtureData.homeSubmission.matches!) {
                match.homeScore = 1;
                match.awayScore = 1;
            }
            await renderComponent(fixtureData.id, appData);

            await doClick(
                context.container,
                'span[title="See home submission"]',
            );

            await doClick(findButton(context.container, 'Unpublish'));

            context.prompts.alertWasShown(
                'Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved',
            );
            const allScores = getScores('strong', (s) => s.textContent!);
            expect(allScores).toEqual(repeat(16, (_) => '1')); // 16 = 8 matches * 2 sides
        });

        it('can unpublish away submission', async () => {
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            for (const match of fixtureData.awaySubmission.matches!) {
                match.homeScore = 2;
                match.awayScore = 2;
            }
            await renderComponent(fixtureData.id, appData);

            await doClick(
                context.container,
                'span[title="See away submission"]',
            );

            await doClick(findButton(context.container, 'Unpublish'));

            context.prompts.alertWasShown(
                'Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved',
            );
            const allScores = getScores('strong', (s) => s.textContent!);
            expect(allScores).toEqual(repeat(16, (_) => '2')); // 16 = 8 matches * 2 sides
        });

        it('can show when only home submission present', async () => {
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = undefined;
            for (const match of fixtureData.homeSubmission.matches!) {
                match.homeScore = 1;
                match.awayScore = 1;
            }
            fixtureData.homeSubmission.away.manOfTheMatch = undefined;
            fixtureData.home.manOfTheMatch = undefined;
            fixtureData.away.manOfTheMatch = undefined;

            await renderComponent(fixtureData.id, appData);
        });

        it('can show when only away submission present', async () => {
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            fixtureData.homeSubmission = undefined;
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            for (const match of fixtureData.awaySubmission.matches!) {
                match.homeScore = 1;
                match.awayScore = 1;
            }
            fixtureData.awaySubmission.home.manOfTheMatch = undefined;
            fixtureData.home.manOfTheMatch = undefined;
            fixtureData.away.manOfTheMatch = undefined;

            await renderComponent(fixtureData.id, appData);
        });

        it('does not render photos button when not permitted', async () => {
            const notPermitted = user({ manageScores: true });
            const appData = getDefaultAppData(notPermitted);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            await renderComponent(fixtureData.id, appData);

            expect(context.container.textContent).not.toContain('Photos');
        });

        it('can open photo manager to view photos', async () => {
            const permitted = user({ manageScores: true, uploadPhotos: true });
            const appData = getDefaultAppData(permitted);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            await renderComponent(fixtureData.id, appData);

            await doClick(findButton(context.container, '📷 Photos'));

            expect(
                dialog()!.querySelector('div[datatype="upload-control"]'),
            ).toBeTruthy();
        });

        it('can close photo manager', async () => {
            const permitted = user({ manageScores: true, uploadPhotos: true });
            const appData = getDefaultAppData(permitted);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            await renderComponent(fixtureData.id, appData);
            await doClick(findButton(context.container, '📷 Photos'));

            await doClick(findButton(dialog(), 'Close'));

            expect(dialog()).toBeFalsy();
        });

        it('can upload photo', async () => {
            const permitted = user({ manageScores: true, uploadPhotos: true });
            const appData = getDefaultAppData(permitted);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            await renderComponent(fixtureData.id, appData);
            await doClick(findButton(context.container, '📷 Photos'));
            uploadPhotoResponse = {
                success: true,
                result: fixtureData,
            };

            const file = 'a photo';
            await setFile(dialog()!, 'input[type="file"]', file, context.user);

            expect(uploadedPhoto?.request.id).toEqual(fixtureData.id);
            expect(uploadedPhoto?.file).toEqual(file);
        });

        it('handles error when uploading photo', async () => {
            const permitted = user({ manageScores: true, uploadPhotos: true });
            const appData = getDefaultAppData(permitted);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            await renderComponent(fixtureData.id, appData);
            await doClick(findButton(context.container, '📷 Photos'));
            uploadPhotoResponse = {
                success: false,
                errors: ['SOME ERROR'],
            };

            await setFile(dialog()!, 'input[type="file"]', 'any', context.user);

            expect(uploadedPhoto).not.toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can delete photo', async () => {
            const permitted = user({ manageScores: true, uploadPhotos: true });
            const appData = getDefaultAppData(permitted);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            const photo: PhotoReferenceDto = {
                id: createTemporaryId(),
                author: permitted.name,
                contentType: 'image/png',
                fileSize: 123,
                created: '',
            };
            fixtureData.photos = [photo];
            await renderComponent(fixtureData.id, appData);
            await doClick(findButton(context.container, '📷 Photos'));
            deletePhotoResponse = {
                success: true,
                result: fixtureData,
            };
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this photo?',
                true,
            );

            await doClick(findButton(dialog()!, '🗑'));

            expect(deletedPhoto).toEqual({
                id: fixtureData.id,
                photoId: photo.id,
            });
        });

        it('handles error when deleting photo', async () => {
            const permitted = user({ manageScores: true, uploadPhotos: true });
            const appData = getDefaultAppData(permitted);
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            const photo: PhotoReferenceDto = {
                id: createTemporaryId(),
                author: permitted.name,
                contentType: 'image/png',
                fileSize: 123,
                created: '',
            };
            fixtureData.photos = [photo];
            await renderComponent(fixtureData.id, appData);
            await doClick(findButton(context.container, '📷 Photos'));
            deletePhotoResponse = {
                success: false,
                errors: ['SOME ERROR'],
            };
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this photo?',
                true,
            );

            await doClick(findButton(dialog(), '🗑'));

            expect(deletedPhoto).not.toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can change to qualifier', async () => {
            fixture.isKnockout = false;
            await renderComponent(fixture.id, appData);

            await doClick(context.container, 'input[name="isKnockout"]');
            await doClick(findButton(context.container, 'Save'));

            const updatedFixture = updatedFixtures[fixture.id];
            expect(updatedFixture.isKnockout).toEqual(true);
            const matchOptions = updatedFixture.matchOptions!;
            const legs = matchOptions.map((mo) => mo.numberOfLegs);
            expect(legs).toEqual([3, 3, 3, 3, 3, 3, 3, 0]);
        });

        it('can change to league fixture', async () => {
            fixture.isKnockout = true;
            await renderComponent(fixture.id, appData);

            await doClick(context.container, 'input[name="isKnockout"]');
            await doClick(findButton(context.container, 'Save'));

            const updatedFixture = updatedFixtures[fixture.id];
            expect(updatedFixture.isKnockout).toEqual(false);
            const matchOptions = updatedFixture.matchOptions!;
            const legs = matchOptions.map((mo) => mo.numberOfLegs);
            expect(legs).toEqual([5, 5, 5, 5, 5, 3, 3, 3]);
        });

        it('can change to league fixture when match options are missing', async () => {
            fixture.isKnockout = true;
            fixture.matchOptions = take(fixture.matchOptions!, 5);
            await renderComponent(fixture.id, appData);

            await doClick(context.container, 'input[name="isKnockout"]');
            await doClick(findButton(context.container, 'Save'));

            const updatedFixture = updatedFixtures[fixture.id];
            expect(updatedFixture.isKnockout).toEqual(false);
            const matchOptions = updatedFixture.matchOptions!;
            const legs = matchOptions.map((mo) => mo.numberOfLegs);
            expect(legs).toEqual([5, 5, 5, 5, 5, 3, 3, 3]);
        });
    });

    describe('when logged in as a home clerk', () => {
        const account = user({ inputResults: true }, createTemporaryId());
        const appData = getDefaultAppData(account);
        const fixture = getUnplayedFixtureData(appData);

        it('renders score card without results', async () => {
            await renderComponent(fixture.id, appData);

            assertScoreCardForClerk();
        });

        it('renders published score card', async () => {
            fixture.resultsPublished = true;

            await renderComponent(fixture.id, appData);

            assertEmptyScoreCard();
        });
    });

    describe('when logged in as an away clerk', () => {
        const account = user({ inputResults: true }, createTemporaryId());
        const appData = getDefaultAppData(account);
        const fixture = getUnplayedFixtureData(appData);

        it('renders score card without results', async () => {
            await renderComponent(fixture.id, appData);

            assertScoreCardForClerk();
        });

        it('renders published score card', async () => {
            fixture.resultsPublished = true;
            await renderComponent(fixture.id, appData);

            assertEmptyScoreCard();
        });
    });
});
