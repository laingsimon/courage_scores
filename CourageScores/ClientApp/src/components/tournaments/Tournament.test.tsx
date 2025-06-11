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
    renderApp,
    setFile,
    TestContext,
} from '../../helpers/tests';
import { Tournament } from './Tournament';
import { any } from '../../helpers/collections';
import { createTemporaryId } from '../../helpers/projection';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { EditTournamentGameDto } from '../../interfaces/models/dtos/Game/EditTournamentGameDto';
import { PatchTournamentDto } from '../../interfaces/models/dtos/Game/PatchTournamentDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { EditTeamPlayerDto } from '../../interfaces/models/dtos/Team/EditTeamPlayerDto';
import { RecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto';
import { UpdateRecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import {
    divisionBuilder,
    divisionDataBuilder,
} from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import {
    roundBuilder,
    sideBuilder,
    tournamentBuilder,
} from '../../helpers/builders/tournaments';
import { teamBuilder } from '../../helpers/builders/teams';
import { playerBuilder } from '../../helpers/builders/players';
import { saygBuilder } from '../../helpers/builders/sayg';
import { DivisionTournamentFixtureDetailsDto } from '../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto';
import { ISaygApi } from '../../interfaces/apis/ISaygApi';
import { IDivisionApi } from '../../interfaces/apis/IDivisionApi';
import { DivisionDataFilter } from '../../interfaces/models/dtos/Division/DivisionDataFilter';
import { IPlayerApi } from '../../interfaces/apis/IPlayerApi';
import { ITournamentGameApi } from '../../interfaces/apis/ITournamentGameApi';
import { PhotoReferenceDto } from '../../interfaces/models/dtos/PhotoReferenceDto';
import { UploadPhotoDto } from '../../interfaces/models/dtos/UploadPhotoDto';
import { CHECKOUT_3_DART, ENTER_SCORE_BUTTON } from '../../helpers/constants';
import { IFeatureApi } from '../../interfaces/apis/IFeatureApi';
import { ConfiguredFeatureDto } from '../../interfaces/models/dtos/ConfiguredFeatureDto';
import { checkoutWith, keyPad } from '../../helpers/sayg';
import { START_SCORING } from './tournaments';
import { AccessDto } from '../../interfaces/models/dtos/Identity/AccessDto';
import { TournamentSideDto } from '../../interfaces/models/dtos/Game/TournamentSideDto';

interface IScenario {
    account?: UserDto;
    seasons: SeasonDto[];
    teams: TeamDto[];
    divisions: DivisionDto[];
}

describe('Tournament', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let divisionDataLookup: { [key: string]: DivisionDataDto };
    let tournamentDataLookup: {
        [id: string]: TournamentGameDto & DivisionTournamentFixtureDetailsDto;
    };
    let updatedTournamentData: EditTournamentGameDto[];
    let patchedTournamentData: { id: string; data: PatchTournamentDto }[];
    let saygDataLookup: { [id: string]: RecordedScoreAsYouGoDto };
    let createdPlayer: {
        divisionId: string;
        seasonId: string;
        teamId: string;
        playerDetails: EditTeamPlayerDto;
    } | null;
    let apiResponse: IClientActionResultDto<any> | null;
    let uploadedPhoto: { request: UploadPhotoDto; file: File } | null;
    let uploadPhotoResponse: IClientActionResultDto<TournamentGameDto> | null;
    let deletedPhoto: { id: string; photoId: string } | null;
    let deletePhotoResponse: IClientActionResultDto<TournamentGameDto> | null;

    const divisionApi = api<IDivisionApi>({
        data: async (filter: DivisionDataFilter) => {
            const seasonId = filter.seasonId;
            const divisionId: string = filter.divisionId?.join(',') || '';
            const key: string = `${divisionId}_${seasonId}`;
            if (any(Object.keys(divisionDataLookup), (k) => k === key)) {
                return divisionDataLookup[key];
            }

            throw new Error('Unexpected request for division data: ' + key);
        },
    });
    const tournamentApi = api<ITournamentGameApi>({
        get: async (id: string) => {
            if (any(Object.keys(tournamentDataLookup), (k) => k === id)) {
                return tournamentDataLookup[id];
            }

            throw new Error('Unexpected request for tournament data: ' + id);
        },
        update: async (data: EditTournamentGameDto) => {
            updatedTournamentData.push(data);
            return apiResponse || { success: true, result: data };
        },
        patch: async (id: string, data: PatchTournamentDto) => {
            patchedTournamentData.push({ id, data });
            return apiResponse || { success: true, result: data };
        },
        async uploadPhoto(
            request: UploadPhotoDto,
            file: File,
        ): Promise<IClientActionResultDto<TournamentGameDto>> {
            uploadedPhoto = { request, file };
            return uploadPhotoResponse!;
        },
        async deletePhoto(
            id: string,
            photoId: string,
        ): Promise<IClientActionResultDto<TournamentGameDto>> {
            deletedPhoto = { id, photoId };
            return deletePhotoResponse!;
        },
    });
    const playerApi = api<IPlayerApi>({
        create: async (
            divisionId: string,
            seasonId: string,
            teamId: string,
            playerDetails: EditTeamPlayerDto,
        ) => {
            createdPlayer = { divisionId, seasonId, teamId, playerDetails };
            return (
                apiResponse || {
                    success: true,
                    result: {
                        seasons: [
                            {
                                seasonId: seasonId,
                                players: [],
                            },
                        ],
                    },
                }
            );
        },
    });
    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            if (any(Object.keys(saygDataLookup), (k) => k === id)) {
                return saygDataLookup[id];
            }

            throw new Error('Unexpected request for sayg data: ' + id);
        },
        upsert: async (
            data: UpdateRecordedScoreAsYouGoDto,
        ): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> => {
            return {
                success: true,
                result: data as RecordedScoreAsYouGoDto,
            };
        },
    });
    const featureApi = api<IFeatureApi>({
        async getFeatures(): Promise<ConfiguredFeatureDto[]> {
            const feature: ConfiguredFeatureDto = {
                name: 'PhotosEnabled',
                configuredValue: 'true',
                id: 'af2ef520-8153-42b0-9ef4-d8419daebc23',
                description: '',
            };
            return [feature];
        },
    });

    function expectDivisionDataRequest(
        divisionId: string,
        seasonId: string,
        data: DivisionDataDto,
    ) {
        const key: string = `${divisionId}_${seasonId}`;
        divisionDataLookup[key] = data;
    }

    function user(access: AccessDto): UserDto {
        return {
            name: '',
            emailAddress: '',
            givenName: '',
            access: access,
        };
    }

    function buildPhoto(name: string): PhotoReferenceDto {
        return {
            id: createTemporaryId(),
            author: name,
            contentType: 'image/png',
            fileSize: 123,
            created: '',
        };
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        tournamentDataLookup = {};
        divisionDataLookup = {};
        saygDataLookup = {};
        reportedError = new ErrorState();
        updatedTournamentData = [];
        patchedTournamentData = [];
        createdPlayer = null;
        apiResponse = null;
        uploadedPhoto = null;
        uploadPhotoResponse = null;
        deletedPhoto = null;
        deletePhotoResponse = null;
    });

    function patchMatchUseCase(access: AccessDto): { user: UserDto } {
        return {
            user: {
                emailAddress: '',
                givenName: '',
                name: '',
                access: Object.assign(
                    {
                        managePlayers: true,
                        recordScoresAsYouGo: true,
                        uploadPhotos: true,
                    },
                    access,
                ),
            },
        };
    }

    function expectedRound(
        scoreA: number,
        scoreB: number,
        sideA: TournamentSideDto,
        sideB: TournamentSideDto,
    ) {
        return {
            match: {
                scoreA,
                scoreB,
                sideA: sideA.id,
                sideB: sideB.id,
            },
        };
    }

    async function renderComponent(
        tournamentId: string,
        scenario: IScenario,
        appLoading?: boolean,
    ) {
        context = await renderApp(
            iocProps({
                divisionApi,
                tournamentApi,
                playerApi,
                saygApi,
                featureApi,
            }),
            brandingProps(),
            appProps(
                {
                    appLoading,
                    account: scenario.account,
                    seasons: scenario.seasons,
                    teams: scenario.teams,
                    reloadTeams: async () => {
                        return scenario.teams;
                    },
                    divisions: scenario.divisions,
                },
                reportedError,
            ),
            <Tournament />,
            '/test/:tournamentId',
            '/test/' + tournamentId,
        );
    }

    const division: DivisionDto = divisionBuilder('DIVISION').build();
    const season: SeasonDto = seasonBuilder('SEASON')
        .starting('2023-01-02T00:00:00')
        .ending('2023-05-02T00:00:00')
        .withDivision(division)
        .build();

    describe('renders', () => {
        let tournamentData: TournamentGameDto;
        let divisionData: DivisionDataDto;

        beforeEach(() => {
            tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();

            divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(
                tournamentData.divisionId!,
                tournamentData.seasonId!,
                divisionData,
            );
            expectDivisionDataRequest(
                '',
                tournamentData.seasonId!,
                divisionData,
            );
        });

        describe('when logged out', () => {
            const teamPlayer = playerBuilder('PLAYER').build();
            const team: TeamDto = teamBuilder('TEAM')
                .forSeason(season, division, [teamPlayer])
                .build();

            async function renderComponentForTest(
                season?: SeasonDto,
                team?: TeamDto | null,
                appLoading?: boolean,
            ) {
                await renderComponent(
                    tournamentData.id,
                    {
                        account: null!,
                        seasons: season ? [season] : [],
                        teams: team ? [team] : [],
                        divisions: [division],
                    },
                    appLoading,
                );
            }

            it('error when no seasons', async () => {
                await renderComponentForTest();

                expect(reportedError.error).toEqual('No seasons found');
            });

            it('loading', async () => {
                await renderComponentForTest(season, null, true);

                reportedError.verifyNoError();
                const container = context.container.querySelector(
                    '.content-background',
                )!;
                expect(container.className).toContain('loading-background');
            });

            it('when tournament not found', async () => {
                tournamentDataLookup[tournamentData.id] = null!;

                await renderComponentForTest(season);

                reportedError.verifyErrorEquals(
                    'Tournament could not be found',
                );
                expect(context.container.textContent).toContain(
                    'Tournament not found',
                );
            });

            it('when tournament season not found', async () => {
                const missingSeason = seasonBuilder('MISSING').build();
                tournamentData.seasonId = missingSeason.id;

                await renderComponentForTest(season);

                reportedError.verifyErrorEquals({
                    message: 'Could not find the season for this tournament',
                    stack: expect.any(String),
                });
            });

            it('tournament without any sides', async () => {
                await renderComponentForTest(season, team);

                reportedError.verifyNoError();
                const heading = context.container.querySelector(
                    '.content-background div[datatype="heading"]',
                )!;
                expect(heading.textContent).toContain(
                    'TYPE at ADDRESS on 2 Jan - NOTES🔗🖨️',
                );
            });

            it('tournament with team sides only', async () => {
                tournamentData.sides!.push(
                    sideBuilder().teamId(team.id).build(),
                );

                await renderComponentForTest(season, team);

                reportedError.verifyNoError();
                const heading = context.container.querySelector(
                    '.content-background div[datatype="heading"]',
                )!;
                expect(heading.textContent).toContain(
                    'TYPE at ADDRESS on 2 Jan - NOTES🔗🖨️',
                );
            });

            it('tournament with sides and players', async () => {
                tournamentData.sides!.push(
                    sideBuilder()
                        .name('SIDE 1')
                        .teamId(team.id)
                        .withPlayer('PLAYER', teamPlayer.id, division.id)
                        .build(),
                );

                await renderComponentForTest(season, team);

                reportedError.verifyNoError();
                const printableSheet = context.container.querySelector(
                    'div[datatype="printable-sheet"]',
                );
                expect(printableSheet).toBeTruthy();
            });
        });

        describe('when logged in', () => {
            const account: UserDto = user({
                manageTournaments: true,
                managePlayers: true,
            });

            async function renderComponentForTest(
                season?: SeasonDto,
                team?: TeamDto | null,
                appLoading?: boolean,
            ) {
                await renderComponent(
                    tournamentData.id,
                    {
                        account,
                        seasons: season ? [season] : [],
                        teams: team ? [team] : [],
                        divisions: [division],
                    },
                    appLoading,
                );
            }

            it('error when no seasons', async () => {
                await renderComponentForTest();

                reportedError.verifyErrorEquals('No seasons found');
            });

            it('loading', async () => {
                await renderComponentForTest(season, null, true);

                reportedError.verifyNoError();
                const container = context.container.querySelector(
                    '.content-background',
                )!;
                expect(container.className).toContain('loading-background');
            });
        });
    });

    describe('interactivity', () => {
        const playerA = playerBuilder('PLAYER A').build();
        const playerB = playerBuilder('PLAYER B').build();
        const playerC = playerBuilder('PLAYER C').build();
        let account: UserDto;
        const permitted: UserDto = user({
            manageTournaments: true,
            managePlayers: true,
            recordScoresAsYouGo: true,
            uploadPhotos: true,
        });
        const teamNoPlayers: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division, [])
            .build();
        const teamWithPlayersABC: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division, [playerA, playerB, playerC])
            .build();
        const sideA: TournamentSideDto = sideBuilder('A')
            .withPlayer(playerA)
            .build();
        const sideB: TournamentSideDto = sideBuilder('B')
            .withPlayer(playerB)
            .build();
        const sideC: TournamentSideDto = sideBuilder('C')
            .withPlayer(playerC)
            .build();
        const notPermittedAccount: UserDto = user({});
        let tournamentData: TournamentGameDto;
        let divisionData: DivisionDataDto;

        beforeEach(() => {
            account = user({
                manageTournaments: true,
                managePlayers: true,
                recordScoresAsYouGo: true,
            });
            tournamentDataLookup = {};
            saygDataLookup = {};
            tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .updated('2023-07-01T00:00:00')
                .addTo(tournamentDataLookup)
                .build();

            divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(
                tournamentData.divisionId!,
                tournamentData.seasonId!,
                divisionData,
            );
            expectDivisionDataRequest(
                '',
                tournamentData.seasonId!,
                divisionData,
            );
        });

        async function renderComponentForTest(
            team?: TeamDto | null,
            useAccount?: UserDto | null,
        ) {
            await renderComponent(tournamentData.id, {
                account: useAccount === undefined ? account : useAccount!,
                seasons: [season],
                teams: team ? [team] : [],
                divisions: [division],
            });

            reportedError.verifyNoError();
        }

        function getSayg(
            homeScore: number,
            awayScore: number,
        ): RecordedScoreAsYouGoDto {
            return saygBuilder()
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home((c) => c.withThrow(homeScore))
                        .away((c) => c.withThrow(awayScore))
                        .currentThrow('home')
                        .playerSequence('home', 'away'),
                )
                .scores(0, 0)
                .startingScore(501)
                .numberOfLegs(3)
                .addTo(saygDataLookup)
                .build();
        }

        it('can open add player dialog', async () => {
            await renderComponentForTest();

            await doClick(findButton(context.container, 'Add player'));

            const addPlayerDialog =
                context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog!.textContent).toContain('Add player');
        });

        it('can add players', async () => {
            const divisionData = divisionDataBuilder(division).build();
            expectDivisionDataRequest(division.id, season.id, divisionData);
            await renderComponentForTest(teamNoPlayers);
            await doClick(findButton(context.container, 'Add player'));
            const addPlayerDialog =
                context.container.querySelector('.modal-dialog')!;

            await doChange(
                addPlayerDialog,
                'input[name="name"]',
                'NEW PLAYER',
                context.user,
            );
            await doSelectOption(
                addPlayerDialog.querySelector('.dropdown-menu'),
                'TEAM',
            );
            await doClick(findButton(addPlayerDialog, 'Add player'));

            reportedError.verifyNoError();
            expect(createdPlayer!.teamId).toEqual(teamNoPlayers.id);
            expect(createdPlayer!.seasonId).toEqual(tournamentData.seasonId);
            expect(createdPlayer!.playerDetails).toEqual({
                captain: false,
                name: 'NEW PLAYER',
            });
        });

        it('can cancel add player dialog', async () => {
            await renderComponentForTest();
            await doClick(findButton(context.container, 'Add player'));

            const addPlayerDialog =
                context.container.querySelector('.modal-dialog');
            await doClick(findButton(addPlayerDialog, 'Cancel'));

            expect(
                context.container.querySelector('.modal-dialog'),
            ).toBeFalsy();
        });

        it('does not save when no details changed', async () => {
            await renderComponentForTest();

            await doClick(
                context.container.querySelector('[datatype="heading"]')!,
            );
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doClick(findButton(dialog, 'Close'));

            expect(updatedTournamentData.length).toEqual(0);
        });

        it('can update details', async () => {
            await renderComponentForTest();

            await doClick(
                context.container.querySelector('[datatype="heading"]')!,
            );
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doChange(
                dialog,
                'input[name="type"]',
                'NEW TYPE',
                context.user,
            );
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournamentData.length).toEqual(1);
            expect(updatedTournamentData[0].type).toEqual('NEW TYPE');
        });

        it('can save changes', async () => {
            await renderComponentForTest();

            await doClick(findButton(context.container, 'Save'));

            expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        });

        it('handles error during save', async () => {
            await renderComponentForTest();
            apiResponse = { success: false, errors: ['SOME ERROR'] };

            await doClick(findButton(context.container, 'Save'));

            expect(context.container.textContent).toContain(
                'Could not save tournament details',
            );
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can close error dialog after save failure', async () => {
            await renderComponentForTest();
            apiResponse = { success: false, errors: ['SOME ERROR'] };
            await doClick(findButton(context.container, 'Save'));
            expect(context.container.textContent).toContain(
                'Could not save tournament details',
            );

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain(
                'Could not save tournament details',
            );
        });

        it('can save changes after match added', async () => {
            tournamentData.singleRound = true;
            tournamentData.host = 'HOST';
            tournamentData.opponent = 'OPPONENT';
            const host = teamBuilder(tournamentData.host)
                .forSeason(season, undefined, [playerA])
                .build();
            const opponent = teamBuilder(tournamentData.opponent)
                .forSeason(season, undefined, [playerB])
                .build();
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [host, opponent],
                divisions: [division],
            });

            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(2) .dropdown-menu',
                ),
                'PLAYER A',
            );
            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(4) .dropdown-menu',
                ),
                'PLAYER B',
            );

            context.prompts.noAlerts();
            expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        });

        it('produces correct match option defaults when no bestOf (1)', async () => {
            tournamentData.singleRound = true;
            tournamentData.host = 'HOST';
            tournamentData.opponent = 'OPPONENT';
            const host = teamBuilder(tournamentData.host)
                .forSeason(season, undefined, [playerA])
                .build();
            const opponent = teamBuilder(tournamentData.opponent)
                .forSeason(season, undefined, [playerB])
                .build();
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [host, opponent],
                divisions: [division],
            });

            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(2) .dropdown-menu',
                ),
                'PLAYER A',
            );
            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(4) .dropdown-menu',
                ),
                'PLAYER B',
            );

            context.prompts.noAlerts();
            const round = updatedTournamentData[0].round!;
            expect(round.matchOptions).toEqual([
                { numberOfLegs: 5, startingScore: 501 },
            ]);
        });

        it('produces correct match option defaults (1)', async () => {
            tournamentData.singleRound = true;
            tournamentData.sides!.push(sideA, sideB);
            tournamentData.bestOf = 7;
            tournamentData.host = 'HOST';
            tournamentData.opponent = 'OPPONENT';
            const host = teamBuilder(tournamentData.host)
                .forSeason(season, undefined, [playerA])
                .build();
            const opponent = teamBuilder(tournamentData.opponent)
                .forSeason(season, undefined, [playerB])
                .build();
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [host, opponent],
                divisions: [division],
            });

            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(2) .dropdown-menu',
                ),
                'PLAYER A',
            );
            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(4) .dropdown-menu',
                ),
                'PLAYER B',
            );

            context.prompts.noAlerts();
            const round = updatedTournamentData[0].round!;
            expect(round.matchOptions).toEqual([
                { numberOfLegs: 7, startingScore: 501 },
            ]);
        });

        it.each([
            patchMatchUseCase({
                manageTournaments: true,
            }),
            patchMatchUseCase({
                enterTournamentResults: true,
            }),
        ])(
            'can patch data with sayg score for match [%s]',
            async (useCase: { user: UserDto }) => {
                const sayg = getSayg(451, 200);
                tournamentData.singleRound = true;
                tournamentData.sides!.push(sideA, sideB);
                tournamentData.round = roundBuilder()
                    .withMatch((m) =>
                        m.saygId(sayg.id).sideA(sideA).sideB(sideB),
                    )
                    .withMatchOption((o) => o.numberOfLegs(3))
                    .build();
                await renderComponentForTest(null, useCase.user);
                await doClick(
                    findButton(
                        context.container.querySelector(
                            'div[datatype="master-draw"] tbody tr:nth-child(1)',
                        ),
                        START_SCORING,
                    ),
                ); // first match
                reportedError.verifyNoError();
                apiResponse = { success: true, result: tournamentData };

                await keyPad(context, ['5', '0', ENTER_SCORE_BUTTON]);
                await checkoutWith(context, CHECKOUT_3_DART);

                reportedError.verifyNoError();
                expect(patchedTournamentData).toEqual([
                    {
                        data: {
                            round: expectedRound(1, 0, sideA, sideB),
                        },
                        id: tournamentData.id,
                    },
                ]);
            },
        );

        it('can patch data with sayg 180 for match', async () => {
            const sayg = getSayg(100, 200);
            tournamentData.sides!.push(sideA, sideB);
            tournamentData.round = roundBuilder()
                .withMatch((m) => m.saygId(sayg.id).sideA(sideA).sideB(sideB))
                .withMatchOption((o) => o.numberOfLegs(3))
                .build();
            await renderComponentForTest();
            await doClick(
                findButton(
                    context.container.querySelector('div[datatype="match"]'),
                    START_SCORING,
                ),
            ); // first match
            reportedError.verifyNoError();
            apiResponse = { success: true, result: tournamentData };

            await keyPad(context, ['1', '8', '0', ENTER_SCORE_BUTTON]);

            reportedError.verifyNoError();
            expect(patchedTournamentData).toEqual([
                {
                    data: {
                        additional180: playerA,
                    },
                    id: tournamentData.id,
                },
            ]);
        });

        it('can patch data with sayg hi-check for match', async () => {
            const sayg = getSayg(401, 200);
            tournamentData.sides!.push(sideA, sideB);
            tournamentData.round = roundBuilder()
                .withMatch((m) => m.saygId(sayg.id).sideA(sideA).sideB(sideB))
                .withMatchOption((o) => o.numberOfLegs(3))
                .build();
            await renderComponentForTest();
            await doClick(
                findButton(
                    context.container.querySelector('div[datatype="match"]'),
                    START_SCORING,
                ),
            ); // first match
            reportedError.verifyNoError();
            apiResponse = { success: true, result: tournamentData };

            await keyPad(context, ['1', '0', '0', ENTER_SCORE_BUTTON]);
            await checkoutWith(context, CHECKOUT_3_DART);

            reportedError.verifyNoError();
            expect(patchedTournamentData).toEqual([
                {
                    data: {
                        additionalOver100Checkout: {
                            id: playerA.id,
                            name: playerA.name,
                            score: 100,
                        },
                    },
                    id: tournamentData.id,
                },
                {
                    data: {
                        round: expectedRound(1, 0, sideA, sideB),
                    },
                    id: tournamentData.id,
                },
            ]);
        });

        it('can handle error during patch', async () => {
            const sayg = getSayg(100, 200);
            tournamentData.sides!.push(sideA, sideB);
            tournamentData.round = roundBuilder()
                .withMatch((m) => m.saygId(sayg.id).sideA(sideA).sideB(sideB))
                .withMatchOption((o) => o.numberOfLegs(3))
                .build();
            await renderComponentForTest();
            await doClick(
                findButton(
                    context.container.querySelector('div[datatype="match"]'),
                    START_SCORING,
                ),
            ); // first match
            reportedError.verifyNoError();
            apiResponse = { success: false, errors: ['SOME ERROR'] };

            await keyPad(context, ['1', '8', '0', ENTER_SCORE_BUTTON]);

            reportedError.verifyNoError();
            expect(patchedTournamentData).not.toBeNull();
            expect(context.container.textContent).toContain(
                'Could not save tournament details',
            );
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can add 180 for player in newly added side', async () => {
            tournamentData.sides!.push(sideA);
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [playerA, playerB])
                .build();
            await renderComponentForTest(team);

            await doClick(
                context.container.querySelector('li[datatype="add-side"]')!,
            );
            reportedError.verifyNoError();
            const editSideDialog =
                context.container.querySelector('.modal-dialog')!;
            await doClick(
                editSideDialog.querySelector('.list-group-item:nth-child(2)')!,
            ); // click on a player
            await doClick(findButton(editSideDialog, 'Add')); // close the dialog
            reportedError.verifyNoError();

            // open the 180s dialog
            await doClick(
                context.container.querySelector('div[data-accolades="180s"]')!,
            );
            const oneEightiesDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            const oneEightyPlayers = Array.from(
                oneEightiesDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(oneEightyPlayers.map((p) => p.textContent)).toContain(
                'PLAYER A',
            );
        });

        it('can add hi-check for player in newly added side', async () => {
            tournamentData.sides!.push(sideA);
            tournamentData.round = roundBuilder().build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [playerA, playerB])
                .build();
            await renderComponentForTest(team);

            await doClick(
                context.container.querySelector('li[datatype="add-side"]')!,
            );
            reportedError.verifyNoError();
            const addSideDialog =
                context.container.querySelector('.modal-dialog')!;
            await doClick(
                addSideDialog.querySelector('.list-group-item:nth-child(2)')!,
            ); // click on a player
            await doClick(findButton(addSideDialog, 'Add')); // close the dialog
            reportedError.verifyNoError();

            // open the hi-checks dialog
            await doClick(
                context.container.querySelector(
                    'div[data-accolades="hi-checks"]',
                )!,
            );
            const hiCheckDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            const hiCheckPlayers = Array.from(
                hiCheckDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(hiCheckPlayers.map((p) => p.textContent)).toContain(
                'PLAYER A',
            );
        });

        it('cannot add 180 for player in newly removed side', async () => {
            tournamentData.sides!.push(sideA, sideB, sideC);
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(teamWithPlayersABC);
            context.prompts.respondToConfirm(
                'Are you sure you want to remove A?',
                true,
            );
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(
                context.container.querySelector('div[data-accolades="180s"]')!,
            );
            let oneEightiesDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            let oneEightyPlayers = Array.from(
                oneEightiesDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(oneEightyPlayers.map((p) => p.textContent)).toEqual([
                ' ',
                'PLAYER A',
                'PLAYER B',
                'PLAYER C',
            ]);
            await doClick(
                findButton(
                    context.container.querySelector('.modal-dialog')!,
                    'Close',
                ),
            ); // close the dialog

            const playing = context.container.querySelector(
                'div[datatype="playing"]',
            )!;
            await doClick(playing.querySelector('li:nth-child(1)')!); // open edit side dialog
            await doClick(
                findButton(
                    context.container.querySelector('.modal-dialog'),
                    'Delete side',
                ),
            ); // delete side A
            reportedError.verifyNoError();

            // open the 180s dialog
            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(
                context.container.querySelector('div[data-accolades="180s"]')!,
            );
            oneEightiesDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            oneEightyPlayers = Array.from(
                oneEightiesDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(oneEightyPlayers.map((p) => p.textContent)).toEqual([
                ' ',
                'PLAYER B',
                'PLAYER C',
            ]);
        });

        it('cannot add hi-check for player in newly removed side', async () => {
            tournamentData.sides!.push(sideA, sideB, sideC);
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(teamWithPlayersABC);
            context.prompts.respondToConfirm(
                'Are you sure you want to remove A?',
                true,
            );
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(
                context.container.querySelector(
                    'div[data-accolades="hi-checks"]',
                )!,
            );
            let hiChecksDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            let hiCheckPlayers = Array.from(
                hiChecksDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(hiCheckPlayers.map((p) => p.textContent)).toEqual([
                ' ',
                'PLAYER A',
                'PLAYER B',
                'PLAYER C',
            ]);
            await doClick(
                findButton(
                    context.container.querySelector('.modal-dialog')!,
                    'Close',
                ),
            ); // close the dialog

            const playing = context.container.querySelector(
                'div[datatype="playing"]',
            )!;
            await doClick(playing.querySelector('li:nth-child(1)')!); // open edit side dialog
            await doClick(
                findButton(
                    context.container.querySelector('.modal-dialog'),
                    'Delete side',
                ),
            ); // delete side A
            reportedError.verifyNoError();

            // open the 180s dialog
            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(
                context.container.querySelector(
                    'div[data-accolades="hi-checks"]',
                )!,
            );
            hiChecksDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            hiCheckPlayers = Array.from(
                hiChecksDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(hiCheckPlayers.map((p) => p.textContent)).toEqual([
                ' ',
                'PLAYER B',
                'PLAYER C',
            ]);
        });

        it('produces correct match option defaults when no bestOf (2)', async () => {
            tournamentData.singleRound = true;
            tournamentData.host = 'HOST';
            tournamentData.opponent = 'OPPONENT';
            const host = teamBuilder(tournamentData.host)
                .forSeason(season, undefined, [playerA])
                .build();
            const opponent = teamBuilder(tournamentData.opponent)
                .forSeason(season, undefined, [playerB])
                .build();
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [host, opponent],
                divisions: [division],
            });

            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(2) .dropdown-menu',
                ),
                'PLAYER A',
            );
            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(4) .dropdown-menu',
                ),
                'PLAYER B',
            );

            context.prompts.noAlerts();
            const round = updatedTournamentData[0].round!;
            expect(round.matchOptions).toEqual([
                { numberOfLegs: 5, startingScore: 501 },
            ]);
        });

        it('produces correct match option defaults (2)', async () => {
            tournamentData.sides!.push(sideA, sideB);
            tournamentData.singleRound = true;
            tournamentData.bestOf = 7;
            tournamentData.host = 'HOST';
            tournamentData.opponent = 'OPPONENT';
            const host = teamBuilder(tournamentData.host)
                .forSeason(season, undefined, [playerA])
                .build();
            const opponent = teamBuilder(tournamentData.opponent)
                .forSeason(season, undefined, [playerB])
                .build();
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [host, opponent],
                divisions: [division],
            });

            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(2) .dropdown-menu',
                ),
                'PLAYER A',
            );
            await doSelectOption(
                context.container.querySelector(
                    'table tbody tr td:nth-child(4) .dropdown-menu',
                ),
                'PLAYER B',
            );

            context.prompts.noAlerts();
            const round = updatedTournamentData[0].round!;
            expect(round.matchOptions).toEqual([
                { numberOfLegs: 7, startingScore: 501 },
            ]);
        });

        it('excludes no-show sides from 180 selection', async () => {
            tournamentData.sides!.push(sideA, sideB, sideC);
            await renderComponentForTest(teamWithPlayersABC);
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(
                context.container.querySelector('div[data-accolades="180s"]')!,
            );
            let oneEightiesDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            let oneEightyPlayers = Array.from(
                oneEightiesDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(oneEightyPlayers.map((p) => p.textContent)).toEqual([
                ' ',
                'PLAYER A',
                'PLAYER B',
                'PLAYER C',
            ]);
            await doClick(
                findButton(
                    context.container.querySelector('.modal-dialog')!,
                    'Close',
                ),
            ); // close the dialog

            const playing = context.container.querySelector(
                'div[datatype="playing"]',
            )!;
            await doClick(playing.querySelector('li:nth-child(1)')!); // open edit side dialog
            await doClick(
                context.container.querySelector(
                    '.modal-dialog input[name="noShow"]',
                )!,
            );
            await doClick(
                findButton(
                    context.container.querySelector('.modal-dialog')!,
                    'Update',
                ),
            );
            reportedError.verifyNoError();

            // open the 180s dialog
            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(
                context.container.querySelector('div[data-accolades="180s"]')!,
            );
            oneEightiesDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            oneEightyPlayers = Array.from(
                oneEightiesDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(oneEightyPlayers.map((p) => p.textContent)).toEqual([
                ' ',
                'PLAYER B',
                'PLAYER C',
            ]);
        });

        it('excludes no-show sides from hi-check selection', async () => {
            tournamentData.sides!.push(sideA, sideB, sideC);
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(teamWithPlayersABC);
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(
                context.container.querySelector(
                    'div[data-accolades="hi-checks"]',
                )!,
            );
            let hiChecksDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            let hiCheckPlayers = Array.from(
                hiChecksDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(hiCheckPlayers.map((p) => p.textContent)).toEqual([
                ' ',
                'PLAYER A',
                'PLAYER B',
                'PLAYER C',
            ]);
            await doClick(
                findButton(
                    context.container.querySelector('.modal-dialog')!,
                    'Close',
                ),
            ); // close the dialog

            const playing = context.container.querySelector(
                'div[datatype="playing"]',
            )!;
            await doClick(playing.querySelector('li:nth-child(1)')!); // open edit side dialog
            await doClick(
                context.container.querySelector(
                    '.modal-dialog input[name="noShow"]',
                )!,
            );
            await doClick(
                findButton(
                    context.container.querySelector('.modal-dialog'),
                    'Update',
                ),
            );
            reportedError.verifyNoError();

            // open the 180s dialog
            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(
                context.container.querySelector(
                    'div[data-accolades="hi-checks"]',
                )!,
            );
            hiChecksDropdown = context.container.querySelector(
                '.modal-dialog .dropdown-menu',
            )!;
            hiCheckPlayers = Array.from(
                hiChecksDropdown.querySelectorAll('.dropdown-item'),
            );
            expect(hiCheckPlayers.map((p) => p.textContent)).toEqual([
                ' ',
                'PLAYER B',
                'PLAYER C',
            ]);
        });

        it('cannot edit tournament details via printable sheet when logged out', async () => {
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(teamNoPlayers, null);

            await doClick(
                context.container.querySelector('div[datatype="heading"]')!,
            );

            reportedError.verifyNoError();
            const editTournamentDialog =
                context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeFalsy();
        });

        it('cannot edit tournament details via printable sheet when not permitted', async () => {
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(teamNoPlayers, notPermittedAccount);

            await doClick(
                context.container.querySelector('div[datatype="heading"]')!,
            );

            reportedError.verifyNoError();
            const editTournamentDialog =
                context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeFalsy();
        });

        it('can edit tournament details via printable sheet when permitted', async () => {
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(teamNoPlayers);

            await doClick(
                context.container.querySelector('div[datatype="heading"]')!,
            );

            reportedError.verifyNoError();
            const editTournamentDialog =
                context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeTruthy();
        });

        it('updating number of legs updates all match options in all matches', async () => {
            tournamentData.round = roundBuilder()
                .withMatchOption((mo) => mo.numberOfLegs(7))
                .round((r) => r.withMatchOption((mo) => mo.numberOfLegs(5)))
                .build();
            await renderComponentForTest(teamNoPlayers);

            await doClick(
                context.container.querySelector('div[datatype="heading"]')!,
            );
            reportedError.verifyNoError();
            const editTournamentDialog =
                context.container.querySelector('.modal-dialog')!;
            await doChange(
                editTournamentDialog,
                'input[name="bestOf"]',
                '9',
                context.user,
            );
            await doClick(findButton(editTournamentDialog, 'Save'));

            expect(updatedTournamentData.length).toEqual(1);
            const firstUpdate = updatedTournamentData[0];
            expect(firstUpdate.bestOf).toEqual(9);
            expect(
                firstUpdate.round!.matchOptions!.map((mo) => mo.numberOfLegs),
            ).toEqual([9]);
            expect(
                firstUpdate.round!.nextRound!.matchOptions!.map(
                    (mo) => mo.numberOfLegs,
                ),
            ).toEqual([9]);
        });

        it('cannot edit tournament details via superleague printable sheet when logged out', async () => {
            tournamentData.round = roundBuilder().build();
            tournamentData.singleRound = true;
            await renderComponentForTest(teamNoPlayers, null);

            await doClick(
                context.container.querySelector('div[datatype="details"]')!,
            );

            reportedError.verifyNoError();
            const editTournamentDialog =
                context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeFalsy();
        });

        it('cannot edit tournament details via superleague printable sheet when not permitted', async () => {
            tournamentData.singleRound = true;
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(teamNoPlayers, notPermittedAccount);

            await doClick(
                context.container.querySelector(
                    'div[datatype="master-draw"] > h2',
                )!,
            );

            reportedError.verifyNoError();
            const editTournamentDialog =
                context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeFalsy();
        });

        it('only includes players from teams with active team seasons', async () => {
            const playerA = playerBuilder('DELETED PLAYER A').build();
            const deletedTeam = teamBuilder('DELETED TEAM')
                .forSeason(season, division, [playerA], true)
                .build();
            tournamentData.sides!.push(
                sideBuilder('SIDE A').teamId(deletedTeam.id).build(),
            );
            tournamentData.sides!.push(sideBuilder('SIDE B').build());
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(deletedTeam);

            await doClick(
                context.container.querySelector('div[data-accolades="180s"]')!,
            );

            const oneEightiesDialog =
                context.container.querySelector('.modal-dialog')!;
            const oneEightiesDropdownItems = Array.from(
                oneEightiesDialog.querySelectorAll(
                    '.dropdown-menu .dropdown-item',
                ),
            );
            expect(
                oneEightiesDropdownItems.map((i) => i.textContent),
            ).not.toContain('DELETED PLAYER A');
        });

        it('does not include null players from a mix of team and player sides', async () => {
            // NOTE: This is now a regression test for when there is invalid data, the scenario should otherwise not be possible
            // The UI will prevent a mix of team vs player sides for a tournament.
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [playerA])
                .build();
            tournamentData.sides!.push(sideA);
            tournamentData.sides!.push(
                sideBuilder('SIDE C').teamId(team.id).build(),
            );
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(team);
            await doClick(
                context.container.querySelector('li[datatype="add-side"]')!,
            );
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doSelectOption(
                dialog.querySelector('.dropdown-menu'),
                'TEAM',
            );
            await doClick(findButton(dialog, 'Add'));
            reportedError.verifyNoError();

            await doClick(
                context.container.querySelector('div[data-accolades="180s"]')!,
            );

            reportedError.verifyNoError();
            const oneEightiesDialog =
                context.container.querySelector('.modal-dialog')!;
            const oneEightiesDropdownItems = Array.from(
                oneEightiesDialog.querySelectorAll(
                    '.dropdown-menu .dropdown-item',
                ),
            );
            expect(oneEightiesDropdownItems.map((i) => i.textContent)).toEqual([
                ' ',
                'PLAYER A',
            ]);
        });

        it('does not render photos button when not permitted', async () => {
            tournamentData.round = roundBuilder().build();

            await renderComponentForTest();

            expect(context.container.textContent).not.toContain('Photos');
        });

        it('can open photo manager to view photos', async () => {
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(null, permitted);

            await doClick(findButton(context.container, '📷 Photos'));

            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(
                dialog.querySelector('div[datatype="upload-control"]'),
            ).toBeTruthy();
        });

        it('can close photo manager', async () => {
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(null, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Close'));

            expect(
                context.container.querySelector('.modal-dialog'),
            ).toBeFalsy();
        });

        it('can upload photo', async () => {
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(null, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog')!;
            uploadPhotoResponse = {
                success: true,
                result: tournamentData,
            };

            const file = 'a photo';
            await setFile(dialog, 'input[type="file"]', file, context.user);

            expect(uploadedPhoto).toEqual({
                request: {
                    id: tournamentData.id,
                },
                file: 'a photo',
            });
        });

        it('handles error when uploading photo', async () => {
            tournamentData.round = roundBuilder().build();
            await renderComponentForTest(null, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog')!;
            uploadPhotoResponse = {
                success: false,
                errors: ['SOME ERROR'],
            };

            const file = 'a photo';
            await setFile(dialog, 'input[type="file"]', file, context.user);

            expect(uploadedPhoto).not.toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can delete photo', async () => {
            const photo: PhotoReferenceDto = buildPhoto(permitted.name);
            tournamentData.round = roundBuilder().build();
            tournamentData.photos = [photo];
            await renderComponentForTest(null, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog');
            deletePhotoResponse = {
                success: true,
                result: tournamentData,
            };
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this photo?',
                true,
            );

            await doClick(findButton(dialog, '🗑'));

            expect(deletedPhoto).toEqual({
                id: tournamentData.id,
                photoId: photo.id,
            });
        });

        it('handles error when deleting photo', async () => {
            tournamentData.round = roundBuilder().build();
            tournamentData.photos = [buildPhoto(permitted.name)];
            await renderComponentForTest(null, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog')!;
            deletePhotoResponse = {
                success: false,
                errors: ['SOME ERROR'],
            };
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this photo?',
                true,
            );

            await doClick(findButton(dialog, '🗑'));

            expect(deletedPhoto).not.toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });
    });
});
