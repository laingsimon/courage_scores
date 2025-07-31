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
    user,
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
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';
import { TournamentRoundDto } from '../../interfaces/models/dtos/Game/TournamentRoundDto';

interface IScenario {
    account?: UserDto;
    seasons: SeasonDto[];
    teams: TeamDto[];
    divisions: DivisionDto[];
}

describe('Tournament', () => {
    const NBSP = ' ';
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

    function dialog() {
        return context.container.querySelector('.modal-dialog');
    }

    function addSideOption() {
        return context.container.querySelector('li[datatype="add-side"]')!;
    }

    function oneEighties() {
        return context.container.querySelector('div[data-accolades="180s"]')!;
    }

    function hiChecks() {
        return context.container.querySelector(
            'div[data-accolades="hi-checks"]',
        )!;
    }

    function accoladePlayers() {
        const items = context.container
            .querySelector('.modal-dialog')!
            .querySelectorAll('.dropdown-menu .dropdown-item');
        return Array.from(items)
            .map((i) => i.textContent)
            .filter((i) => i !== NBSP);
    }

    function heading() {
        return context.container.querySelector('div[datatype="heading"]')!;
    }

    function playing() {
        return context.container.querySelector('div[datatype="playing"]')!;
    }

    async function selectPlayer(home: string, away: string) {
        const homeSelector = `table tbody tr td:nth-child(2) .dropdown-menu`;
        const awaySelector = `table tbody tr td:nth-child(4) .dropdown-menu`;
        const container = context.container;
        await doSelectOption(container.querySelector(homeSelector), home);
        await doSelectOption(container.querySelector(awaySelector), away);
    }

    function equatablePatch(tournamentData: TournamentGameDto, data: object) {
        return {
            data,
            id: tournamentData.id,
        };
    }

    async function startScoring(selector: string) {
        await doClick(
            findButton(
                context.container.querySelector(`${selector}`),
                START_SCORING,
            ),
        );
    }

    function makeApiResponse<T>(result: T, success?: boolean) {
        return {
            success: !!success,
            result: result,
        };
    }

    function makeApiFailure(error: string) {
        return {
            success: false,
            errors: [error],
        };
    }

    function getNoOfLegs(round?: TournamentRoundDto) {
        return round!.matchOptions!.map((mo) => mo.numberOfLegs);
    }

    const division: DivisionDto = divisionBuilder('DIVISION').build();
    const season: SeasonDto = seasonBuilder('SEASON')
        .starting('2023-01-02T00:00:00')
        .ending('2023-05-02T00:00:00')
        .withDivision(division)
        .build();

    function makeTeam(name: string, ...players: TeamPlayerDto[]) {
        return teamBuilder(name).forSeason(season, division, players).build();
    }

    async function render(
        tournamentData: TournamentGameDto,
        season?: SeasonDto,
        team?: TeamDto,
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
            const team = makeTeam('TEAM', teamPlayer);

            it('error when no seasons', async () => {
                await render(tournamentData);

                expect(reportedError.error).toEqual('No seasons found');
            });

            it('loading', async () => {
                await render(tournamentData, season, undefined, true);

                const container = context.container.querySelector(
                    '.content-background',
                )!;
                expect(container.className).toContain('loading-background');
                reportedError.verifyNoError();
            });

            it('when tournament not found', async () => {
                tournamentDataLookup[tournamentData.id] = null!;

                await render(tournamentData, season);

                reportedError.verifyErrorEquals(
                    'Tournament could not be found',
                );
                expect(context.container.textContent).toContain(
                    'Tournament not found',
                );
            });

            it('when tournament season not found', async () => {
                tournamentData.seasonId = createTemporaryId();

                await render(tournamentData, season);

                reportedError.verifyErrorEquals({
                    message: 'Could not find the season for this tournament',
                    stack: expect.any(String),
                });
            });

            it('tournament without any sides', async () => {
                await render(tournamentData, season, team);

                expect(heading().textContent).toContain(
                    'TYPE at ADDRESS on 2 Jan - NOTES🔗🖨️',
                );
                reportedError.verifyNoError();
            });

            it('tournament with team sides only', async () => {
                tournamentData.sides!.push(
                    sideBuilder().teamId(team.id).build(),
                );

                await render(tournamentData, season, team);

                expect(heading().textContent).toContain(
                    'TYPE at ADDRESS on 2 Jan - NOTES🔗🖨️',
                );
                reportedError.verifyNoError();
            });

            it('tournament with sides and players', async () => {
                tournamentData.sides!.push(
                    sideBuilder()
                        .name('SIDE 1')
                        .teamId(team.id)
                        .withPlayer('PLAYER', teamPlayer.id, division.id)
                        .build(),
                );

                await render(tournamentData, season, team);

                const selector = 'div[datatype="printable-sheet"]';
                const printable = context.container.querySelector(selector);
                expect(printable).toBeTruthy();
                reportedError.verifyNoError();
            });
        });

        describe('when logged in', () => {
            it('error when no seasons', async () => {
                await render(tournamentData);

                reportedError.verifyErrorEquals('No seasons found');
            });

            it('loading', async () => {
                await render(tournamentData, season, undefined, true);

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
        const allPlayers = ['PLAYER A', 'PLAYER B', 'PLAYER C'];
        const account = user({
            manageTournaments: true,
            managePlayers: true,
            recordScoresAsYouGo: true,
        });
        const permitted = user({
            ...account.access,
            uploadPhotos: true,
        });
        const teamNoPlayers = makeTeam('TEAM');
        const teamWithPlayersABC = makeTeam('TEAM', playerA, playerB, playerC);
        const sideA = sideBuilder('A').withPlayer(playerA).build();
        const sideB = sideBuilder('B').withPlayer(playerB).build();
        const sideC = sideBuilder('C').withPlayer(playerC).build();
        const notPermittedAccount = user({});
        const deletePhotoPrompt = 'Are you sure you want to delete this photo?';
        let tournamentData: TournamentGameDto;
        let divisionData: DivisionDataDto;

        beforeEach(() => {
            tournamentDataLookup = {};
            saygDataLookup = {};
            tournamentData = tournamentBuilder()
                .forSeason(season)
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

        async function render(team?: TeamDto, useAccount?: UserDto) {
            await renderComponent(tournamentData.id, {
                account: useAccount ?? account,
                seasons: [season],
                teams: team ? [team] : [],
                divisions: [division],
            });

            reportedError.verifyNoError();
        }

        function getSayg(home: number, away: number): RecordedScoreAsYouGoDto {
            return saygBuilder()
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home((c) => c.withThrow(home))
                        .away((c) => c.withThrow(away))
                        .currentThrow('home')
                        .playerSequence('home', 'away'),
                )
                .addTo(saygDataLookup)
                .build();
        }

        function superleague(host: string, opponent: string, bestOf?: number) {
            tournamentData.singleRound = true;
            tournamentData.host = host;
            tournamentData.opponent = opponent;
            tournamentData.bestOf = bestOf ?? tournamentData.bestOf;
        }

        it('can open add player dialog', async () => {
            await render();

            await doClick(findButton(context.container, 'Add player'));

            expect(dialog()!.textContent).toContain('Add player');
        });

        it('can add players', async () => {
            const divisionData = divisionDataBuilder(division).build();
            expectDivisionDataRequest(division.id, season.id, divisionData);
            await render(teamNoPlayers);
            await doClick(findButton(context.container, 'Add player'));

            await doChange(
                dialog()!,
                'input[name="name"]',
                'NEW PLAYER',
                context.user,
            );
            const teams = dialog()!.querySelector('.dropdown-menu');
            await doSelectOption(teams, 'TEAM');
            await doClick(findButton(dialog()!, 'Add player'));

            expect(createdPlayer!.teamId).toEqual(teamNoPlayers.id);
            expect(createdPlayer!.seasonId).toEqual(tournamentData.seasonId);
            expect(createdPlayer!.playerDetails.name).toEqual('NEW PLAYER');
            expect(createdPlayer!.playerDetails.captain).toEqual(false);
        });

        it('can cancel add player dialog', async () => {
            await render();
            await doClick(findButton(context.container, 'Add player'));

            await doClick(findButton(dialog()!, 'Cancel'));

            expect(dialog()).toBeFalsy();
        });

        it('does not save when no details changed', async () => {
            await render();

            await doClick(heading());
            await doClick(findButton(dialog(), 'Close'));

            expect(updatedTournamentData.length).toEqual(0);
        });

        it('can update details', async () => {
            await render();

            await doClick(heading());
            await doChange(
                dialog()!,
                'input[name="type"]',
                'NEW TYPE',
                context.user,
            );
            await doClick(findButton(dialog()!, 'Save'));

            const types = updatedTournamentData.map((d) => d.type);
            expect(types).toEqual(['NEW TYPE']);
        });

        it('can save changes', async () => {
            await render();

            await doClick(findButton(context.container, 'Save'));

            expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        });

        it('handles error during save', async () => {
            await render();
            apiResponse = makeApiFailure('SOME ERROR');

            await doClick(findButton(context.container, 'Save'));

            const textContent = context.container.textContent;
            expect(textContent).toContain('Could not save tournament details');
            expect(textContent).toContain('SOME ERROR');
        });

        it('can close error dialog after save failure', async () => {
            await render();
            apiResponse = makeApiFailure('SOME ERROR');
            await doClick(findButton(context.container, 'Save'));
            let textContent = context.container.textContent;
            const errorDetails = 'Could not save tournament details';
            expect(textContent).toContain(errorDetails);

            await doClick(findButton(context.container, 'Close'));

            textContent = context.container.textContent;
            expect(textContent).not.toContain(errorDetails);
        });

        it('can save changes after match added', async () => {
            superleague('HOST', 'OPPONENT');
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [
                    makeTeam(tournamentData.host!, playerA),
                    makeTeam(tournamentData.opponent!, playerB),
                ],
                divisions: [division],
            });

            await selectPlayer('PLAYER A', 'PLAYER B');

            context.prompts.noAlerts();
            expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        });

        it('produces correct match option defaults when no bestOf (1)', async () => {
            superleague('HOST', 'OPPONENT');
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [
                    makeTeam(tournamentData.host!, playerA),
                    makeTeam(tournamentData.opponent!, playerB),
                ],
                divisions: [division],
            });

            await selectPlayer('PLAYER A', 'PLAYER B');

            context.prompts.noAlerts();
            const options = updatedTournamentData[0].round!.matchOptions;
            expect(options).toEqual([{ numberOfLegs: 5, startingScore: 501 }]);
        });

        it('produces correct match option defaults (1)', async () => {
            superleague('HOST', 'OPPONENT', 7);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [
                    makeTeam(tournamentData.host!, playerA),
                    makeTeam(tournamentData.opponent!, playerB),
                ],
                divisions: [division],
            });

            await selectPlayer('PLAYER A', 'PLAYER B');

            context.prompts.noAlerts();
            const options = updatedTournamentData[0].round!.matchOptions;
            expect(options).toEqual([{ numberOfLegs: 7, startingScore: 501 }]);
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
                tournamentData.round = roundBuilder()
                    .withMatch((m) =>
                        m.saygId(sayg.id).sideA(sideA).sideB(sideB),
                    )
                    .withMatchOption((o) => o.numberOfLegs(3))
                    .build();
                await render(undefined, useCase.user);
                await startScoring(
                    'div[datatype="master-draw"] tbody tr:nth-child(1)',
                ); // first match
                apiResponse = { success: true, result: tournamentData };

                await keyPad(context, ['5', '0', ENTER_SCORE_BUTTON]);
                await checkoutWith(context, CHECKOUT_3_DART);

                expect(patchedTournamentData).toEqual([
                    equatablePatch(tournamentData, {
                        round: expectedRound(1, 0, sideA, sideB),
                    }),
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
            await render();
            await startScoring('div[datatype="match"]');
            apiResponse = { success: true, result: tournamentData };

            await keyPad(context, ['1', '8', '0', ENTER_SCORE_BUTTON]);

            expect(patchedTournamentData).toEqual([
                equatablePatch(tournamentData, {
                    additional180: playerA,
                }),
            ]);
        });

        it('can patch data with sayg hi-check for match', async () => {
            const sayg = getSayg(401, 200);
            tournamentData.sides!.push(sideA, sideB);
            tournamentData.round = roundBuilder()
                .withMatch((m) => m.saygId(sayg.id).sideA(sideA).sideB(sideB))
                .withMatchOption((o) => o.numberOfLegs(3))
                .build();
            await render();
            await startScoring('div[datatype="match"]'); // first match
            apiResponse = { success: true, result: tournamentData };

            await keyPad(context, ['1', '0', '0', ENTER_SCORE_BUTTON]);
            await checkoutWith(context, CHECKOUT_3_DART);

            expect(patchedTournamentData).toEqual([
                equatablePatch(tournamentData, {
                    additionalOver100Checkout: {
                        id: playerA.id,
                        name: playerA.name,
                        score: 100,
                    },
                }),
                equatablePatch(tournamentData, {
                    round: expectedRound(1, 0, sideA, sideB),
                }),
            ]);
        });

        it('can handle error during patch', async () => {
            const sayg = getSayg(100, 200);
            tournamentData.sides!.push(sideA, sideB);
            tournamentData.round = roundBuilder()
                .withMatch((m) => m.saygId(sayg.id).sideA(sideA).sideB(sideB))
                .withMatchOption((o) => o.numberOfLegs(3))
                .build();
            await render();
            await doClick(
                findButton(
                    context.container.querySelector('div[datatype="match"]'),
                    START_SCORING,
                ),
            ); // first match
            apiResponse = makeApiFailure('SOME ERROR');

            await keyPad(context, ['1', '8', '0', ENTER_SCORE_BUTTON]);

            expect(patchedTournamentData).not.toBeNull();
            const textContent = context.container.textContent;
            expect(textContent).toContain('Could not save tournament details');
            expect(textContent).toContain('SOME ERROR');
        });

        it('can add 180 for player in newly added side', async () => {
            tournamentData.sides!.push(sideA);
            await render(makeTeam('TEAM', playerA, playerB));

            await doClick(addSideOption());
            const selector = '.list-group-item:nth-child(2)';
            await doClick(dialog()!.querySelector(selector)!); // click on a player
            await doClick(findButton(dialog()!, 'Add')); // close the dialog

            await doClick(oneEighties());
            expect(accoladePlayers()).toContain('PLAYER A');
        });

        it('can add hi-check for player in newly added side', async () => {
            tournamentData.sides!.push(sideA);
            await render(makeTeam('TEAM', playerA, playerB));

            await doClick(addSideOption());
            const selector = '.list-group-item:nth-child(2)';
            await doClick(dialog()!.querySelector(selector)!); // click on a player
            await doClick(findButton(dialog()!, 'Add')); // close the dialog

            await doClick(hiChecks());
            expect(accoladePlayers()).toContain('PLAYER A');
        });

        it('cannot add 180 for player in newly removed side', async () => {
            tournamentData.sides!.push(sideA, sideB, sideC);
            await render(teamWithPlayersABC);
            context.prompts.respondToConfirm(
                'Are you sure you want to remove A?',
                true,
            );
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(oneEighties());
            expect(accoladePlayers()).toEqual(allPlayers);
            await doClick(findButton(dialog()!, 'Close')); // close the dialog

            await doClick(playing().querySelector('li:nth-child(1)')!); // open edit side dialog
            await doClick(findButton(dialog(), 'Delete side')); // delete side A

            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(oneEighties());
            expect(accoladePlayers()).toEqual(['PLAYER B', 'PLAYER C']);
        });

        it('cannot add hi-check for player in newly removed side', async () => {
            tournamentData.sides!.push(sideA, sideB, sideC);
            await render(teamWithPlayersABC);
            context.prompts.respondToConfirm(
                'Are you sure you want to remove A?',
                true,
            );
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(hiChecks());
            expect(accoladePlayers()).toEqual(allPlayers);
            await doClick(findButton(dialog()!, 'Close')); // close the dialog

            await doClick(playing().querySelector('li:nth-child(1)')!); // open edit side dialog
            await doClick(findButton(dialog(), 'Delete side')); // delete side A

            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(hiChecks());
            expect(accoladePlayers()).toEqual(['PLAYER B', 'PLAYER C']);
        });

        it('produces correct match option defaults when no bestOf (2)', async () => {
            superleague('HOST', 'OPPONENT');
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [
                    makeTeam(tournamentData.host!, playerA),
                    makeTeam(tournamentData.opponent!, playerB),
                ],
                divisions: [division],
            });

            await selectPlayer('PLAYER A', 'PLAYER B');

            context.prompts.noAlerts();
            const options = updatedTournamentData[0].round!.matchOptions;
            expect(options).toEqual([{ numberOfLegs: 5, startingScore: 501 }]);
        });

        it('produces correct match option defaults (2)', async () => {
            superleague('HOST', 'OPPONENT', 7);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [
                    makeTeam(tournamentData.host!, playerA),
                    makeTeam(tournamentData.opponent!, playerB),
                ],
                divisions: [division],
            });

            await selectPlayer('PLAYER A', 'PLAYER B');

            context.prompts.noAlerts();
            const options = updatedTournamentData[0].round!.matchOptions;
            expect(options).toEqual([{ numberOfLegs: 7, startingScore: 501 }]);
        });

        it('excludes no-show sides from 180 selection', async () => {
            tournamentData.sides!.push(sideA, sideB, sideC);
            await render(teamWithPlayersABC);
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(oneEighties());
            expect(accoladePlayers()).toEqual(allPlayers);
            await doClick(findButton(dialog()!, 'Close')); // close the dialog

            await doClick(playing().querySelector('li:nth-child(1)')!); // open edit side dialog
            await doClick(dialog()!.querySelector('input[name="noShow"]')!);
            await doClick(findButton(dialog()!, 'Update'));

            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(oneEighties());
            expect(accoladePlayers()).toEqual(['PLAYER B', 'PLAYER C']);
        });

        it('excludes no-show sides from hi-check selection', async () => {
            tournamentData.sides!.push(sideA, sideB, sideC);
            await render(teamWithPlayersABC);
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(hiChecks());
            expect(accoladePlayers()).toEqual(allPlayers);
            await doClick(findButton(dialog()!, 'Close')); // close the dialog

            await doClick(playing().querySelector('li:nth-child(1)')!); // open edit side dialog
            await doClick(dialog()!.querySelector('input[name="noShow"]')!);
            await doClick(findButton(dialog(), 'Update'));

            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(hiChecks());
            expect(accoladePlayers()).toEqual(['PLAYER B', 'PLAYER C']);
        });

        it('cannot edit tournament details via printable sheet when logged out', async () => {
            await render(teamNoPlayers, user({}));

            await doClick(heading());

            expect(dialog()).toBeFalsy();
        });

        it('cannot edit tournament details via printable sheet when not permitted', async () => {
            await render(teamNoPlayers, notPermittedAccount);

            await doClick(heading());

            expect(dialog()).toBeFalsy();
        });

        it('can edit tournament details via printable sheet when permitted', async () => {
            await render(teamNoPlayers);

            await doClick(heading());

            expect(dialog()).toBeTruthy();
        });

        it('updating number of legs updates all match options in all matches', async () => {
            tournamentData.round = roundBuilder()
                .withMatchOption((mo) => mo.numberOfLegs(7))
                .round((r) => r.withMatchOption((mo) => mo.numberOfLegs(5)))
                .build();
            await render(teamNoPlayers);

            await doClick(heading());
            await doChange(
                dialog()!,
                'input[name="bestOf"]',
                '9',
                context.user,
            );
            await doClick(findButton(dialog()!, 'Save'));

            expect(updatedTournamentData.length).toEqual(1);
            const firstUpdate = updatedTournamentData[0];
            expect(firstUpdate.bestOf).toEqual(9);
            expect(getNoOfLegs(firstUpdate.round)).toEqual([9]);
            expect(getNoOfLegs(firstUpdate.round!.nextRound)).toEqual([9]);
        });

        it('only includes players from teams with active team seasons', async () => {
            const playerA = playerBuilder('DELETED PLAYER A').build();
            const deletedTeam = teamBuilder('DELETED TEAM')
                .forSeason(season, division, [playerA], true)
                .build();
            const sideA = sideBuilder('SIDE A').teamId(deletedTeam.id).build();
            tournamentData.sides!.push(sideA, sideBuilder('SIDE B').build());
            await render(deletedTeam);

            await doClick(oneEighties());

            expect(accoladePlayers()).not.toContain('DELETED PLAYER A');
        });

        it('does not include null players from a mix of team and player sides', async () => {
            // NOTE: This is now a regression test for when there is invalid data, the scenario should otherwise not be possible
            // The UI will prevent a mix of team vs player sides for a tournament.
            const team = makeTeam('TEAM', playerA);
            const sideC = sideBuilder('SIDE C').teamId(team.id).build();
            tournamentData.sides!.push(sideA, sideC);
            await render(team);
            await doClick(addSideOption());
            await doSelectOption(
                dialog()!.querySelector('.dropdown-menu'),
                'TEAM',
            );
            await doClick(findButton(dialog(), 'Add'));

            await doClick(oneEighties());

            expect(accoladePlayers()).toEqual(['PLAYER A']);
        });

        it('does not render photos button when not permitted', async () => {
            await render();

            expect(context.container.textContent).not.toContain('Photos');
        });

        it('can open photo manager to view photos', async () => {
            await render(undefined, permitted);

            await doClick(findButton(context.container, '📷 Photos'));

            const selector = 'div[datatype="upload-control"]';
            expect(dialog()!.querySelector(selector)).toBeTruthy();
        });

        it('can close photo manager', async () => {
            await render(undefined, permitted);
            await doClick(findButton(context.container, '📷 Photos'));

            await doClick(findButton(dialog(), 'Close'));

            expect(dialog()).toBeFalsy();
        });

        it('can upload photo', async () => {
            await render(undefined, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            uploadPhotoResponse = makeApiResponse(tournamentData, true);

            const file = 'a photo';
            await setFile(dialog()!, 'input[type="file"]', file, context.user);

            expect(uploadedPhoto!.file).toEqual(file);
            expect(uploadedPhoto!.request.id).toEqual(tournamentData.id);
        });

        it('handles error when uploading photo', async () => {
            await render(undefined, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            uploadPhotoResponse = makeApiFailure('SOME ERROR');

            await setFile(dialog()!, 'input[type="file"]', 'any', context.user);

            expect(uploadedPhoto).not.toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can delete photo', async () => {
            const photo = buildPhoto(permitted.name);
            tournamentData.photos = [photo];
            await render(undefined, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            deletePhotoResponse = makeApiResponse(tournamentData, true);
            context.prompts.respondToConfirm(deletePhotoPrompt, true);

            await doClick(findButton(dialog(), '🗑'));

            expect(deletedPhoto!.id).toEqual(tournamentData.id);
            expect(deletedPhoto!.photoId).toEqual(photo.id);
        });

        it('handles error when deleting photo', async () => {
            tournamentData.photos = [buildPhoto(permitted.name)];
            await render(undefined, permitted);
            await doClick(findButton(context.container, '📷 Photos'));
            deletePhotoResponse = makeApiFailure('SOME ERROR');
            context.prompts.respondToConfirm(deletePhotoPrompt, true);

            await doClick(findButton(dialog(), '🗑'));

            expect(deletedPhoto).not.toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });
    });
});
