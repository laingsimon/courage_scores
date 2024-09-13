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
    renderApp, setFile, TestContext
} from "../../helpers/tests";
import {Tournament} from "./Tournament";
import {any} from "../../helpers/collections";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {EditTournamentGameDto} from "../../interfaces/models/dtos/Game/EditTournamentGameDto";
import {PatchTournamentDto} from "../../interfaces/models/dtos/Game/PatchTournamentDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {EditTeamPlayerDto} from "../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {divisionBuilder, divisionDataBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {
    ITournamentMatchBuilder, ITournamentRoundBuilder,
    ITournamentSideBuilder, sideBuilder,
    tournamentBuilder
} from "../../helpers/builders/tournaments";
import {teamBuilder} from "../../helpers/builders/teams";
import {playerBuilder} from "../../helpers/builders/players";
import {IMatchOptionsBuilder} from "../../helpers/builders/games";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../helpers/builders/sayg";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {IDivisionApi} from "../../interfaces/apis/IDivisionApi";
import {DivisionDataFilter} from "../../interfaces/models/dtos/Division/DivisionDataFilter";
import {IPlayerApi} from "../../interfaces/apis/IPlayerApi";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {PhotoReferenceDto} from "../../interfaces/models/dtos/PhotoReferenceDto";
import {UploadPhotoDto} from "../../interfaces/models/dtos/UploadPhotoDto";
import {CHECKOUT_3_DART, ENTER_SCORE_BUTTON} from "../../helpers/constants";
import {IFeatureApi} from "../../interfaces/apis/IFeatureApi";
import {ConfiguredFeatureDto} from "../../interfaces/models/dtos/ConfiguredFeatureDto";
import {checkoutWith, keyPad} from "../../helpers/sayg";
import {START_SCORING} from "./tournaments";

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
    let tournamentDataLookup: { [id: string]: TournamentGameDto & DivisionTournamentFixtureDetailsDto };
    let updatedTournamentData: EditTournamentGameDto[];
    let patchedTournamentData: {id: string, data: PatchTournamentDto}[];
    let saygDataLookup: { [id: string]: RecordedScoreAsYouGoDto };
    let createdPlayer: {divisionId: string, seasonId: string, teamId: string, playerDetails: EditTeamPlayerDto};
    let apiResponse: IClientActionResultDto<any>;
    let uploadedPhoto: { request: UploadPhotoDto, file: File };
    let uploadPhotoResponse: IClientActionResultDto<TournamentGameDto>;
    let deletedPhoto: { id: string, photoId: string };
    let deletePhotoResponse: IClientActionResultDto<TournamentGameDto>;

    const divisionApi = api<IDivisionApi>({
        data: async (filter: DivisionDataFilter) => {
            const seasonId = filter.seasonId;
            const divisionId: string = filter.divisionId.join(',');
            const key: string = `${divisionId}_${seasonId}`;
            if (any(Object.keys(divisionDataLookup), k => k === key)) {
                return divisionDataLookup[key];
            }

            throw new Error('Unexpected request for division data: ' + key);
        }
    });
    const tournamentApi = api<ITournamentGameApi>({
        get: async (id: string) => {
            if (any(Object.keys(tournamentDataLookup), k => k === id)) {
                return tournamentDataLookup[id];
            }

            throw new Error('Unexpected request for tournament data: ' + id);
        },
        update: async (data: EditTournamentGameDto) => {
            updatedTournamentData.push(data);
            return apiResponse || {success: true, result: data};
        },
        patch: async (id: string, data: PatchTournamentDto) => {
            patchedTournamentData.push({id, data});
            return apiResponse || {success: true, result: data};
        },
        async uploadPhoto(request: UploadPhotoDto, file: File): Promise<IClientActionResultDto<TournamentGameDto>> {
            uploadedPhoto = {request, file};
            return uploadPhotoResponse;
        },
        async deletePhoto(id: string, photoId: string): Promise<IClientActionResultDto<TournamentGameDto>> {
            deletedPhoto = { id, photoId };
            return deletePhotoResponse;
        }
    });
    const playerApi = api<IPlayerApi>({
        create: async (divisionId: string, seasonId: string, teamId: string, playerDetails: EditTeamPlayerDto) => {
            createdPlayer = {divisionId, seasonId, teamId, playerDetails};
            return apiResponse || {
                success: true,
                result: {
                    seasons: [{
                        seasonId: seasonId,
                        players: [],
                    }],
                }
            };
        }
    });
    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            if (any(Object.keys(saygDataLookup), k => k === id)) {
                return saygDataLookup[id];
            }

            throw new Error('Unexpected request for sayg data: ' + id);
        },
        upsert: async (data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> => {
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
            return [ feature ];
        }
    });

    function expectDivisionDataRequest(divisionId: string, seasonId: string, data: DivisionDataDto) {
        if (!divisionDataLookup) {
            divisionDataLookup = {};
        }

        const key: string = `${divisionId}_${seasonId}`;
        divisionDataLookup[key] = data;
    }

    afterEach(async () => {
        divisionDataLookup = {};
        tournamentDataLookup = {};
        saygDataLookup = {};
        await cleanUp(context);
    });

    beforeEach(() => {
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

    async function renderComponent(tournamentId: string, scenario: IScenario, appLoading: boolean) {
        context = await renderApp(
            iocProps({
                divisionApi,
                tournamentApi,
                playerApi,
                saygApi,
                featureApi,
            }),
            brandingProps(),
            appProps({
                appLoading,
                account: scenario.account,
                seasons: scenario.seasons,
                teams: scenario.teams,
                reloadTeams: async () => {
                    return scenario.teams;
                },
                divisions: scenario.divisions,
            }, reportedError),
            (<Tournament/>),
            '/test/:tournamentId',
            '/test/' + tournamentId);
    }

    const division: DivisionDto = divisionBuilder('DIVISION').build();
    const season: SeasonDto = seasonBuilder('SEASON')
        .starting('2023-01-02T00:00:00')
        .ending('2023-05-02T00:00:00')
        .withDivision(division)
        .build();

    describe('renders', () => {
        describe('when logged out', () => {
            const account = null;

            beforeEach(() => {
                tournamentDataLookup = {};
                saygDataLookup = {};
            });

            it('error when no seasons', async () => {
                const tournamentData: TournamentGameDto = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData: DivisionDataDto = divisionDataBuilder().build();
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [],
                    teams: [],
                    divisions: [division],
                }, false);

                expect(reportedError.error).toEqual('No seasons found');
            });

            it('loading', async () => {
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }, true);

                reportedError.verifyNoError();
                const container = context.container.querySelector('.content-background');
                expect(container).toBeTruthy();
                expect(container.className).toContain('loading-background');
            });

            it('when tournament not found', async () => {
                const id = createTemporaryId();
                tournamentDataLookup[id] = null;

                await renderComponent(id, {
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }, false);

                reportedError.verifyErrorEquals('Tournament could not be found');
                expect(context.container.textContent).toContain('Tournament not found');
            });

            it('when tournament season not found', async () => {
                const missingSeason = seasonBuilder('MISSING').build();
                const tournamentData = tournamentBuilder()
                    .forSeason(missingSeason) // non-existent season id
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }, false);

                reportedError.verifyErrorEquals({
                    message: 'Could not find the season for this tournament',
                    stack: expect.any(String),
                });
            });

            it('tournament without any sides', async () => {
                const teamPlayer = playerBuilder('PLAYER').build();
                const team = teamBuilder('TEAM')
                    .forSeason(season, division, [ teamPlayer ])
                    .build();
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest('', tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [season],
                    teams: [team],
                    divisions: [division],
                }, false);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background div[datatype="heading"]');
                expect(heading).toBeTruthy();
                expect(heading.textContent).toContain('TYPE at ADDRESS on 2 Jan - NOTES🔗🖨️');
            });

            it('tournament with team sides only', async () => {
                const teamPlayer = playerBuilder('PLAYER').build();
                const team = teamBuilder('TEAM')
                    .forSeason(season, division, [ teamPlayer ])
                    .build();
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .withSide((s: ITournamentSideBuilder) => s.teamId(team.id))
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest('', tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [season],
                    teams: [team],
                    divisions: [division],
                }, false);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background div[datatype="heading"]');
                expect(heading).toBeTruthy();
                expect(heading.textContent).toContain('TYPE at ADDRESS on 2 Jan - NOTES🔗🖨️');
            });

            it('tournament with sides and players', async () => {
                const teamPlayer = playerBuilder('PLAYER').build();
                const team = teamBuilder('TEAM')
                    .forSeason(season, division, [ teamPlayer ])
                    .build();
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .withSide((s: ITournamentSideBuilder) => s
                        .name('SIDE 1')
                        .teamId(team.id)
                        .withPlayer('PLAYER', teamPlayer.id, division.id))
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest('', tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [season],
                    teams: [team],
                    divisions: [division],
                }, false);

                reportedError.verifyNoError();
                const printableSheet = context.container.querySelector('div[datatype="printable-sheet"]');
                expect(printableSheet).toBeTruthy();
            });
        });

        describe('when logged in', () => {
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: {
                    manageTournaments: true,
                    managePlayers: true,
                }
            };

            beforeEach(() => {
                tournamentDataLookup = {};
                saygDataLookup = {};
            });

            it('error when no seasons', async () => {
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [],
                    teams: [],
                    divisions: [division],
                }, false);

                reportedError.verifyErrorEquals('No seasons found');
            });

            it('loading', async () => {
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }, true);

                reportedError.verifyNoError();
                const container = context.container.querySelector('.content-background');
                expect(container).toBeTruthy();
                expect(container.className).toContain('loading-background');
            });

            it('tournament with sides and players', async () => {
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1').withPlayer('PLAYER', null, division.id))
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .accoladesCount()
                    .singleRound()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest(division.id, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }, false);

                await doClick(context.container.querySelector('div[datatype="master-draw"] table tr'));

                reportedError.verifyNoError();
                const editTournamentComponent = context.container.querySelector('.content-background > div:nth-child(1)');
                expect(editTournamentComponent).toBeTruthy();
                expect(editTournamentComponent.textContent).toContain('Playing:');
                const sides = editTournamentComponent.querySelector('div:nth-child(2)');
                expect(sides.textContent).toContain('SIDE 1');
            });
        });
    });

    describe('interactivity', () => {
        const account: UserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                manageTournaments: true,
                managePlayers: true,
                recordScoresAsYouGo: true,
            }
        };

        beforeEach(() => {
            tournamentDataLookup = {};
            saygDataLookup = {};
        });

        it('can open add player dialog', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);

            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);

            await doClick(findButton(context.container, 'Add player'));

            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Add player');
        });

        it('can add players', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder(division).build();
            expectDivisionDataRequest(division.id, tournamentData.seasonId, divisionData);
            const team = teamBuilder('TEAM').forSeason(tournamentData.seasonId, divisionData.id).build()
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, 'Add player'));
            const addPlayerDialog = context.container.querySelector('.modal-dialog');

            await doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER', context.user);
            await doSelectOption(addPlayerDialog.querySelector('.dropdown-menu'), 'TEAM');
            await doClick(findButton(addPlayerDialog, 'Add player'));

            reportedError.verifyNoError();
            expect(createdPlayer).not.toBeNull();
            expect(createdPlayer.teamId).toEqual(team.id);
            expect(createdPlayer.seasonId).toEqual(tournamentData.seasonId);
            expect(createdPlayer.playerDetails).toEqual({
                captain: false,
                newTeamId: undefined,
                emailAddress: undefined,
                name: 'NEW PLAYER',
            });
        });

        it('can cancel add player dialog', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, 'Add player'));

            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(addPlayerDialog, 'Cancel'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can update details', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .updated('2023-07-01T00:00:00')
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('div[datatype="details"] > div.alert'));
            const dialog = context.container.querySelector('div.modal-dialog');
            await doChange(dialog, 'input[name="type"]', 'NEW TYPE', context.user);
            await doClick(findButton(dialog, 'Close'));

            expect(updatedTournamentData.length).toEqual(1);
            expect(updatedTournamentData[0].type).toEqual('NEW TYPE');
        });

        it('can save changes', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);

            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);

            await doClick(findButton(context.container, 'Save'));

            expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        });

        it('handles error during save', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(context.container, 'Save'));

            expect(context.container.textContent).toContain('Could not save tournament details');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can close error dialog after save failure', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await doClick(findButton(context.container, 'Save'));
            expect(context.container.textContent).toContain('Could not save tournament details');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save tournament details');
        });

        it('cannot save changes when match not added', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 2'))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container.querySelector('div[datatype="master-draw"] table tr'));
            await doSelectOption(context.container.querySelector('table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');

            await doClick(findButton(context.container, 'Close'));

            expect(alert).toEqual('Add the (new) match before saving, otherwise it would be lost.\n' +
                '\n' +
                'SIDE 1 vs SIDE 2');
        });

        it('can save changes after match added', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 2'))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container.querySelector('div[datatype="master-draw"] table tr'));
            await doSelectOption(context.container.querySelector('table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('table tr td:nth-child(6)'), '➕'));

            await doClick(findButton(context.container, 'Close'));

            expect(alert).toBeFalsy();
            expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        });

        it('produces correct match option defaults when no bestOf (1)', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 2'))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container.querySelector('div[datatype="master-draw"] table tr'));
            await doSelectOption(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(6)'), '➕'));

            await doClick(findButton(context.container, 'Close'));

            expect(alert).toBeFalsy();
            const round = updatedTournamentData[0].round;
            expect(round.matchOptions).toEqual([{ numberOfLegs: 5, startingScore: 501 }]);
        });

        it('produces correct match option defaults (1)', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 2'))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .bestOf(7)
                .accoladesCount()
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container.querySelector('div[datatype="master-draw"] table tr'));
            await doSelectOption(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(6)'), '➕'));

            await doClick(findButton(context.container, 'Close'));

            expect(alert).toBeFalsy();
            const round = updatedTournamentData[0].round;
            expect(round.matchOptions).toEqual([{ numberOfLegs: 7, startingScore: 501 }]);
        });

        it('can patch data with sayg score for match', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const sayg = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(451))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(200))
                    .currentThrow('home')
                    .playerSequence('home', 'away'))
                .scores(0, 0)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const sideA = sideBuilder('A').withPlayer(playerA).build();
            const sideB = sideBuilder('B').withPlayer(playerB).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide(sideA)
                .withSide(sideB)
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .saygId(sayg.id)
                        .sideA(sideA)
                        .sideB(sideB))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(division.id, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"] tbody tr:nth-child(1)'), START_SCORING)); // first match
            reportedError.verifyNoError();
            apiResponse = {success: true, result: tournamentData};

            await keyPad(context, [ '5', '0', ENTER_SCORE_BUTTON ]);
            await checkoutWith(context, CHECKOUT_3_DART);

            reportedError.verifyNoError();
            expect(patchedTournamentData).toEqual([{
                data: {
                    round: {
                        match: {
                            scoreA: 1,
                            scoreB: 0,
                            sideA: sideA.id,
                            sideB: sideB.id,
                        },
                    }
                },
                id: tournamentData.id,
            }]);
        });

        it('can patch data with sayg 180 for match', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const sayg = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(200))
                    .currentThrow('home')
                    .playerSequence('home', 'away'))
                .scores(0, 0)
                .addTo(saygDataLookup)
                .build();
            const sideA = sideBuilder('A').withPlayer(playerA).build();
            const sideB = sideBuilder('B').withPlayer(playerB).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide(sideA)
                .withSide(sideB)
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .saygId(sayg.id)
                        .sideA(sideA)
                        .sideB(sideB))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(division.id, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container.querySelector('div[datatype="match"]'), START_SCORING)); // first match
            reportedError.verifyNoError();
            apiResponse = {success: true, result: tournamentData};

            await keyPad(context, [ '1', '8', '0', ENTER_SCORE_BUTTON ]);

            reportedError.verifyNoError();
            expect(patchedTournamentData).toEqual([{
                data: {
                    additional180: playerA,
                },
                id: tournamentData.id,
            }]);
        });

        it('can patch data with sayg hi-check for match', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const sayg = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(401))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(200))
                    .currentThrow('home')
                    .playerSequence('home', 'away'))
                .scores(0, 0)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const sideA = sideBuilder('A').withPlayer(playerA).build();
            const sideB = sideBuilder('B').withPlayer(playerB).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide(sideA)
                .withSide(sideB)
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .saygId(sayg.id)
                        .sideA(sideA)
                        .sideB(sideB))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(division.id, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container.querySelector('div[datatype="match"]'), START_SCORING)); // first match
            reportedError.verifyNoError();
            apiResponse = {success: true, result: tournamentData};

            await keyPad(context, [ '1', '0', '0', ENTER_SCORE_BUTTON ]);
            await checkoutWith(context, CHECKOUT_3_DART);

            reportedError.verifyNoError();
            expect(patchedTournamentData).toEqual([{
                data: {
                    additionalOver100Checkout: {
                        id: playerA.id,
                        name: playerA.name,
                        score: 100,
                        team: null,
                    },
                },
                id: tournamentData.id,
            }, {
                data: {
                    round: {
                        match: {
                            scoreA: 1,
                            scoreB: 0,
                            sideA: sideA.id,
                            sideB: sideB.id,
                        },
                    },
                },
                id: tournamentData.id,
            }]);
        });

        it('can handle error during patch', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const sayg = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(200))
                    .currentThrow('home')
                    .playerSequence('home', 'away'))
                .scores(0, 0)
                .addTo(saygDataLookup)
                .build();
            const sideA = sideBuilder('A').withPlayer(playerA).build();
            const sideB = sideBuilder('B').withPlayer(playerB).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide(sideA)
                .withSide(sideB)
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .saygId(sayg.id)
                        .sideA(sideA)
                        .sideB(sideB))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(division.id, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container.querySelector('div[datatype="match"]'), START_SCORING)); // first match
            reportedError.verifyNoError();
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await keyPad(context, [ '1', '8', '0', ENTER_SCORE_BUTTON ]);

            reportedError.verifyNoError();
            expect(patchedTournamentData).not.toBeNull();
            expect(context.container.textContent).toContain('Could not save tournament details');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can add 180 for player in newly added side', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER A').withPlayer(playerA))
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA, playerB ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);

            reportedError.verifyNoError();
            await doClick(context.container.querySelector('li[datatype="add-side"]'));
            reportedError.verifyNoError();
            const editSideDialog = context.container.querySelector('.modal-dialog');
            await doClick(editSideDialog.querySelector('.list-group-item:nth-child(2)')); // click on a player
            await doClick(findButton(editSideDialog, 'Save')); // close the dialog
            reportedError.verifyNoError();

            // open the 180s dialog
            await doClick(context.container.querySelector('div[data-accolades="180s"]'));
            const oneEightiesDialog = context.container.querySelector('.modal-dialog');
            const oneEightiesDropdown = oneEightiesDialog.querySelector('.dropdown-menu');
            const oneEightyPlayers = Array.from(oneEightiesDropdown.querySelectorAll('.dropdown-item'));
            expect(oneEightyPlayers.map(p => p.textContent)).toContain('PLAYER A');
        });

        it('can add hi-check for player in newly added side', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER A').withPlayer(playerA))
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA, playerB ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('li[datatype="add-side"]'));
            reportedError.verifyNoError();
            const addSideDialog = context.container.querySelector('.modal-dialog');
            await doClick(addSideDialog.querySelector('.list-group-item:nth-child(2)')); // click on a player
            await doClick(findButton(addSideDialog, 'Save')); // close the dialog
            reportedError.verifyNoError();

            // open the hi-checks dialog
            await doClick(context.container.querySelector('div[data-accolades="hi-checks"]'));
            const hiCheckDialog = context.container.querySelector('.modal-dialog');
            const hiCheckDropdown = hiCheckDialog.querySelector('.dropdown-menu');
            const hiCheckPlayers = Array.from(hiCheckDropdown.querySelectorAll('.dropdown-item'));
            expect(hiCheckPlayers.map(p => p.textContent)).toContain('PLAYER A');
        });

        it('cannot add 180 for player in newly removed side', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const playerC = playerBuilder('PLAYER C').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER A').withPlayer(playerA))
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER B').withPlayer(playerB))
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER C').withPlayer(playerC))
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA, playerB, playerC ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);
            window.confirm = () => true;
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(context.container.querySelector('div[data-accolades="180s"]'));
            let oneEightiesDialog = context.container.querySelector('.modal-dialog');
            let oneEightiesDropdown = oneEightiesDialog.querySelector('.dropdown-menu');
            let oneEightyPlayers = Array.from(oneEightiesDropdown.querySelectorAll('.dropdown-item'));
            expect(oneEightyPlayers.map(p => p.textContent)).toEqual([ ' ', 'PLAYER A', 'PLAYER B', 'PLAYER C' ]);
            await doClick(findButton(oneEightiesDialog, 'Close')); // close the dialog

            const playing = context.container.querySelector('div[datatype="playing"]');
            await doClick(playing.querySelector('li:nth-child(1)')); // open edit side dialog
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Delete side')); // delete side A
            reportedError.verifyNoError();

            // open the 180s dialog
            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(context.container.querySelector('div[data-accolades="180s"]'));
            oneEightiesDialog = context.container.querySelector('.modal-dialog');
            oneEightiesDropdown = oneEightiesDialog.querySelector('.dropdown-menu');
            oneEightyPlayers = Array.from(oneEightiesDropdown.querySelectorAll('.dropdown-item'));
            expect(oneEightyPlayers.map(p => p.textContent)).toEqual([ ' ', 'PLAYER B', 'PLAYER C' ]);
        });

        it('cannot add hi-check for player in newly removed side', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const playerC = playerBuilder('PLAYER C').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER A').withPlayer(playerA))
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER B').withPlayer(playerB))
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER C').withPlayer(playerC))
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA, playerB, playerC ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);
            window.confirm = () => true;
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(context.container.querySelector('div[data-accolades="hi-checks"]'));
            let hiChecksDialog = context.container.querySelector('.modal-dialog');
            let hiChecksDropdown = hiChecksDialog.querySelector('.dropdown-menu');
            let hiCheckPlayers = Array.from(hiChecksDropdown.querySelectorAll('.dropdown-item'));
            expect(hiCheckPlayers.map(p => p.textContent)).toEqual([ ' ', 'PLAYER A', 'PLAYER B', 'PLAYER C' ]);
            await doClick(findButton(hiChecksDialog, 'Close')); // close the dialog

            const playing = context.container.querySelector('div[datatype="playing"]');
            await doClick(playing.querySelector('li:nth-child(1)')); // open edit side dialog
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Delete side')); // delete side A
            reportedError.verifyNoError();

            // open the 180s dialog
            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(context.container.querySelector('div[data-accolades="hi-checks"]'));
            hiChecksDialog = context.container.querySelector('.modal-dialog');
            hiChecksDropdown = hiChecksDialog.querySelector('.dropdown-menu');
            hiCheckPlayers = Array.from(hiChecksDropdown.querySelectorAll('.dropdown-item'));
            expect(hiCheckPlayers.map(p => p.textContent)).toEqual([ ' ', 'PLAYER B', 'PLAYER C' ]);
        });

        it('produces correct match option defaults when no bestOf (2)', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 2'))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container.querySelector('div[datatype="master-draw"] table tr'));
            await doSelectOption(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(6)'), '➕')); // add match

            await doClick(findButton(context.container, 'Close'));

            expect(alert).toBeFalsy();
            const round = updatedTournamentData[0].round;
            expect(round.matchOptions).toEqual([{ numberOfLegs: 5, startingScore: 501 }]);
        });

        it('produces correct match option defaults (2)', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 2'))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .bestOf(7)
                .accoladesCount()
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container.querySelector('div[datatype="master-draw"] table tr'));
            await doSelectOption(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('div[datatype="edit-tournament"] table tr td:nth-child(6)'), '➕')); // add match

            await doClick(findButton(context.container, 'Close'));

            expect(alert).toBeFalsy();
            const round = updatedTournamentData[0].round;
            expect(round.matchOptions).toEqual([{ numberOfLegs: 7, startingScore: 501 }]);
        });

        it('excludes no-show sides from 180 selection', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const playerC = playerBuilder('PLAYER C').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER A').withPlayer(playerA))
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER B').withPlayer(playerB))
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER C').withPlayer(playerC))
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA, playerB, playerC ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(context.container.querySelector('div[data-accolades="180s"]'));
            let oneEightiesDialog = context.container.querySelector('.modal-dialog');
            let oneEightiesDropdown = oneEightiesDialog.querySelector('.dropdown-menu');
            let oneEightyPlayers = Array.from(oneEightiesDropdown.querySelectorAll('.dropdown-item'));
            expect(oneEightyPlayers.map(p => p.textContent)).toEqual([ ' ', 'PLAYER A', 'PLAYER B', 'PLAYER C' ]);
            await doClick(findButton(oneEightiesDialog, 'Close')); // close the dialog

            const playing = context.container.querySelector('div[datatype="playing"]');
            await doClick(playing.querySelector('li:nth-child(1)')); // open edit side dialog
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(dialog.querySelector('input[name="noShow"]'));
            await doClick(findButton(dialog, 'Save'));
            reportedError.verifyNoError();

            // open the 180s dialog
            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(context.container.querySelector('div[data-accolades="180s"]'));
            oneEightiesDialog = context.container.querySelector('.modal-dialog');
            oneEightiesDropdown = oneEightiesDialog.querySelector('.dropdown-menu');
            oneEightyPlayers = Array.from(oneEightiesDropdown.querySelectorAll('.dropdown-item'));
            expect(oneEightyPlayers.map(p => p.textContent)).toEqual([ ' ', 'PLAYER B', 'PLAYER C' ]);
        });

        it('excludes no-show sides from hi-check selection', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const playerC = playerBuilder('PLAYER C').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER A').withPlayer(playerA))
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER B').withPlayer(playerB))
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER C').withPlayer(playerC))
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA, playerB, playerC ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);
            // verify that all 3 players CAN be selected before the side is removed
            await doClick(context.container.querySelector('div[data-accolades="hi-checks"]'));
            let hiChecksDialog = context.container.querySelector('.modal-dialog');
            let hiChecksDropdown = hiChecksDialog.querySelector('.dropdown-menu');
            let hiCheckPlayers = Array.from(hiChecksDropdown.querySelectorAll('.dropdown-item'));
            expect(hiCheckPlayers.map(p => p.textContent)).toEqual([ ' ', 'PLAYER A', 'PLAYER B', 'PLAYER C' ]);
            await doClick(findButton(hiChecksDialog, 'Close')); // close the dialog

            const playing = context.container.querySelector('div[datatype="playing"]');
            await doClick(playing.querySelector('li:nth-child(1)')); // open edit side dialog
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(dialog.querySelector('input[name="noShow"]'));
            await doClick(findButton(dialog, 'Save'));
            reportedError.verifyNoError();

            // open the 180s dialog
            // verify that only the 2 remaining players can be selected after a side has been removed
            await doClick(context.container.querySelector('div[data-accolades="hi-checks"]'));
            hiChecksDialog = context.container.querySelector('.modal-dialog');
            hiChecksDropdown = hiChecksDialog.querySelector('.dropdown-menu');
            hiCheckPlayers = Array.from(hiChecksDropdown.querySelectorAll('.dropdown-item'));
            expect(hiCheckPlayers.map(p => p.textContent)).toEqual([ ' ', 'PLAYER B', 'PLAYER C' ]);
        });

        it('cannot edit tournament details via printable sheet when logged out', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: null,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('div[datatype="heading"]'));

            reportedError.verifyNoError();
            const editTournamentDialog = context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeFalsy();
        });

        it('cannot edit tournament details via printable sheet when not permitted', async () => {
            const notPermittedAccount: UserDto = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: { },
            };
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: notPermittedAccount,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('div[datatype="heading"]'));

            reportedError.verifyNoError();
            const editTournamentDialog = context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeFalsy();
        });

        it('can edit tournament details via printable sheet when permitted', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('div[datatype="heading"]'));

            reportedError.verifyNoError();
            const editTournamentDialog = context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeTruthy();
        });

        it('updating number of legs updates all match options in all matches', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatchOption((mo: IMatchOptionsBuilder) => mo.numberOfLegs(7))
                    .round((r: ITournamentRoundBuilder) => r.withMatchOption((mo: IMatchOptionsBuilder) => mo.numberOfLegs(5))))
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);
            reportedError.verifyNoError();

            await doClick(context.container.querySelector('div[datatype="heading"]'));
            reportedError.verifyNoError();
            const editTournamentDialog = context.container.querySelector('.modal-dialog');
            await doChange(editTournamentDialog, 'input[name="bestOf"]', '9', context.user);
            await doClick(findButton(context.container, 'Save'));

            expect(updatedTournamentData.length).toEqual(1);
            const firstUpdate = updatedTournamentData[0];
            expect(firstUpdate.bestOf).toEqual(9);
            expect(firstUpdate.round.matchOptions.map(mo => mo.numberOfLegs)).toEqual([ 9 ]);
            expect(firstUpdate.round.nextRound.matchOptions.map(mo => mo.numberOfLegs)).toEqual([ 9 ]);
        });

        it('cannot edit tournament details via superleague printable sheet when logged out', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: null,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('div[datatype="details"]'));

            reportedError.verifyNoError();
            const editTournamentDialog = context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeFalsy();
        });

        it('cannot edit tournament details via superleague printable sheet when not permitted', async () => {
            const notPermittedAccount: UserDto = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: { },
            };
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: notPermittedAccount,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('div[datatype="master-draw"] > h2'));

            reportedError.verifyNoError();
            const editTournamentDialog = context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeFalsy();
        });

        it('can edit tournament details via superleague printable sheet when permitted', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .singleRound()
                .addTo(tournamentDataLookup)
                .build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ ])
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('div[datatype="master-draw"] div[datatype="details"]'));

            reportedError.verifyNoError();
            const editTournamentDialog = context.container.querySelector('.modal-dialog');
            expect(editTournamentDialog).toBeTruthy();
        });

        it('only includes players from teams with active team seasons', async () => {
            const playerA = playerBuilder('DELETED PLAYER A').build();
            const deletedTeam = teamBuilder('DELETED TEAM')
                .forSeason(season, division, [ playerA ], true)
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE A').teamId(deletedTeam.id))
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE B'))
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [deletedTeam],
                divisions: [division],
            }, false);

            await doClick(context.container.querySelector('div[data-accolades="180s"]'));

            const oneEightiesDialog = context.container.querySelector('.modal-dialog');
            const oneEightiesDropdownItems = Array.from(oneEightiesDialog.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(oneEightiesDropdownItems.map(i => i.textContent)).not.toContain('DELETED PLAYER A');
            expect(oneEightiesDropdownItems.map(i => i.textContent)).not.toContain('DELETED PLAYER B');
        });

        it('does not include null players from a mix of team and player sides', async () => {
            // NOTE: This is now a regression test for when there is invalid data, the scenario should otherwise not be possible
            // The UI will prevent a mix of team vs player sides for a tournament.
            const playerA = playerBuilder('PLAYER A').build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA ])
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE B').withPlayer(playerA))
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE C').teamId(team.id))
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }, false);
            const addSide = context.container.querySelector('li[datatype="add-side"]');
            await doClick(addSide);
            reportedError.verifyNoError();
            const dialog = context.container.querySelector('div.modal-dialog');
            expect(dialog).toBeTruthy();
            await doSelectOption(dialog.querySelector('.dropdown-menu'), 'TEAM');
            await doClick(findButton(dialog, 'Save'));
            reportedError.verifyNoError();

            await doClick(context.container.querySelector('div[data-accolades="180s"]'));

            reportedError.verifyNoError();
            const oneEightiesDialog = context.container.querySelector('.modal-dialog');
            const oneEightiesDropdownItems = Array.from(oneEightiesDialog.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(oneEightiesDropdownItems.map(i => i.textContent)).toEqual([' ', 'PLAYER A']);
        });

        it('does not render photos button when not permitted', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);

            await renderComponent(tournamentData.id, {
                account: account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);

            expect(context.container.textContent).not.toContain('Photos');
        });

        it('can open photo manager to view photos', async () => {
            const permitted = Object.assign({}, account);
            account.access.uploadPhotos = true;
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: permitted,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);

            await doClick(findButton(context.container, '📷 Photos'));

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.querySelector('div[datatype="upload-control"]')).toBeTruthy();
        });

        it('can close photo manager', async () => {
            const permitted = Object.assign({}, account);
            account.access.uploadPhotos = true;
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: permitted,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can upload photo', async () => {
            const permitted = Object.assign({}, account);
            account.access.uploadPhotos = true;
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: permitted,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog');
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
            const permitted = Object.assign({}, account);
            account.access.uploadPhotos = true;
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: permitted,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog');
            uploadPhotoResponse = {
                success: false,
                errors: [ 'SOME ERROR' ]
            };

            const file = 'a photo';
            await setFile(dialog, 'input[type="file"]', file, context.user);

            expect(uploadedPhoto).not.toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can delete photo', async () => {
            const permitted = Object.assign({}, account);
            account.access.uploadPhotos = true;
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const photo: PhotoReferenceDto = {
                id: createTemporaryId(),
                author: permitted.name,
                contentType: 'image/png',
                fileSize: 123,
            };
            tournamentData.photos = [photo];
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: permitted,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog');
            deletePhotoResponse = {
                success: true,
                result: tournamentData,
            };
            window.confirm = () => true;

            await doClick(findButton(dialog, '🗑'));

            expect(deletedPhoto).toEqual({
                id: tournamentData.id,
                photoId: photo.id,
            });
        });

        it('handles error when deleting photo', async () => {
            const permitted = Object.assign({}, account);
            account.access.uploadPhotos = true;
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const photo: PhotoReferenceDto = {
                id: createTemporaryId(),
                author: permitted.name,
                contentType: 'image/png',
                fileSize: 123,
            };
            tournamentData.photos = [photo];
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest('', tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: permitted,
                seasons: [season],
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📷 Photos'));
            const dialog = context.container.querySelector('.modal-dialog');
            deletePhotoResponse = {
                success: false,
                errors: [ 'SOME ERROR' ]
            };
            window.confirm = () => true;

            await doClick(findButton(dialog, '🗑'));

            expect(deletedPhoto).not.toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });
    });
});