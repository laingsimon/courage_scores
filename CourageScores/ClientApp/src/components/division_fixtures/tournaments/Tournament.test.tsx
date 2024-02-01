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
} from "../../../helpers/tests";
import React from "react";
import {Tournament} from "./Tournament";
import {any, DataMap, toMap} from "../../../helpers/collections";
import {createTemporaryId, EMPTY_ID} from "../../../helpers/projection";
import {DivisionDataDto} from "../../../interfaces/models/dtos/Division/DivisionDataDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {EditTournamentGameDto} from "../../../interfaces/models/dtos/Game/EditTournamentGameDto";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {EditTeamPlayerDto} from "../../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {ExportDataRequestDto} from "../../../interfaces/models/dtos/Data/ExportDataRequestDto";
import {RecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {UpdateRecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {UserDto} from "../../../interfaces/models/dtos/Identity/UserDto";
import {SeasonDto} from "../../../interfaces/models/dtos/Season/SeasonDto";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {DivisionDto} from "../../../interfaces/models/dtos/DivisionDto";
import {divisionBuilder, divisionDataBuilder} from "../../../helpers/builders/divisions";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {
    ITournamentMatchBuilder, ITournamentRoundBuilder,
    ITournamentSideBuilder, sideBuilder,
    tournamentBuilder
} from "../../../helpers/builders/tournaments";
import {teamBuilder} from "../../../helpers/builders/teams";
import {playerBuilder} from "../../../helpers/builders/players";
import {IMatchOptionsBuilder} from "../../../helpers/builders/games";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../../helpers/builders/sayg";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {ISaygApi} from "../../../interfaces/apis/ISaygApi";
import {IDivisionApi} from "../../../interfaces/apis/IDivisionApi";
import {DivisionDataFilter} from "../../../interfaces/models/dtos/Division/DivisionDataFilter";
import {IPlayerApi} from "../../../interfaces/apis/IPlayerApi";
import {ITournamentGameApi} from "../../../interfaces/apis/ITournamentGameApi";
import {IDataApi} from "../../../interfaces/apis/IDataApi";

interface IScenario {
    account?: UserDto;
    seasons: DataMap<SeasonDto>;
    teams: DataMap<TeamDto>;
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
    let exportRequest: ExportDataRequestDto;
    let apiResponse: IClientActionResultDto<any>;

    const divisionApi = api<IDivisionApi>({
        data: async (divisionId: string, filter: DivisionDataFilter) => {
            const seasonId = filter.seasonId;
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
    const dataApi = api<IDataApi>({
        export: async (request: ExportDataRequestDto) => {
            exportRequest = request;
            return {success: true, result: {zip: 'content'}};
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

    function expectDivisionDataRequest(divisionId: string, seasonId: string, data: DivisionDataDto) {
        if (!divisionDataLookup) {
            divisionDataLookup = {};
        }

        const key: string = `${divisionId}_${seasonId}`;
        divisionDataLookup[key] = data;
    }

    afterEach(() => {
        divisionDataLookup = {};
        tournamentDataLookup = {};
        saygDataLookup = {};
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedTournamentData = [];
        patchedTournamentData = [];
        createdPlayer = null;
        exportRequest = null;
        apiResponse = null;
    });

    async function renderComponent(tournamentId: string, scenario: IScenario, appLoading: boolean) {
        context = await renderApp(
            iocProps({
                divisionApi,
                tournamentApi,
                playerApi,
                dataApi,
                saygApi,
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

    async function assertDataChange(existingData: TournamentGameDto, expectedChange: TournamentGameDto) {
        await doClick(findButton(context.container, 'Save'));
        expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        const update = updatedTournamentData.shift();
        expect(update.lastUpdated).toEqual(existingData.updated || '<updated> not defined in existing data');
        expect(update).toEqual(
            Object.assign({ lastUpdated: update.lastUpdated }, existingData, expectedChange));
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
                    seasons: toMap([]),
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
                    seasons: toMap([season]),
                    teams: [],
                    divisions: [division],
                }, true);

                expect(reportedError.hasError()).toEqual(false);
                const container = context.container.querySelector('.content-background');
                expect(container).toBeTruthy();
                expect(container.className).toContain('loading-background');
            });

            it('when tournament not found', async () => {
                const id = createTemporaryId();
                tournamentDataLookup[id] = null;

                await renderComponent(id, {
                    account,
                    seasons: toMap([season]),
                    teams: [],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(true);
                expect(reportedError.error).toEqual('Tournament could not be found');
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
                    seasons: toMap([season]),
                    teams: [],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(true);
                expect(reportedError.error.message).toEqual('Could not find the season for this tournament');
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
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([season]),
                    teams: [team],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(false);
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
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([season]),
                    teams: [team],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(false);
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
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([season]),
                    teams: [team],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(false);
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
                    seasons: toMap([]),
                    teams: [],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(true);
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
                    seasons: toMap([season]),
                    teams: [],
                    divisions: [division],
                }, true);

                expect(reportedError.hasError()).toEqual(false);
                const container = context.container.querySelector('.content-background');
                expect(container).toBeTruthy();
                expect(container.className).toContain('loading-background');
            });

            it('tournament without any sides', async () => {
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
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([season]),
                    teams: [],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(false);
                // address
                const address = context.container.querySelector('.content-background > div:nth-child(2)');
                expect(address).toBeTruthy();
                expect(address.textContent).toContain('Address');
                expect(address.querySelector('input').value).toEqual('ADDRESS');
                // type
                const type = context.container.querySelector('.content-background > div:nth-child(3)');
                expect(type).toBeTruthy();
                expect(type.textContent).toContain('Type');
                expect(type.querySelector('input').value).toEqual('TYPE');
                // notes
                const notes = context.container.querySelector('.content-background > div:nth-child(4)');
                expect(notes).toBeTruthy();
                expect(notes.textContent).toContain('Notes');
                expect(notes.querySelector('textarea').value).toEqual('NOTES');
                // accolades qualify
                const accoladesCountAndDivision = context.container.querySelector('.content-background > div:nth-child(5)');
                expect(accoladesCountAndDivision).toBeTruthy();
                expect(accoladesCountAndDivision.textContent).toContain('Include 180s and Hi-checks in players table?');
                expect(accoladesCountAndDivision.querySelector('input').checked).toEqual(true);
                // division
                expect(accoladesCountAndDivision.textContent).toContain('Division');
                expect(accoladesCountAndDivision.querySelector('.dropdown-item.active').textContent).toEqual('DIVISION');
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
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([season]),
                    teams: [],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(false);
                const editTournamentComponent = context.container.querySelector('.content-background > div:nth-child(6)');
                expect(editTournamentComponent).toBeTruthy();
                expect(editTournamentComponent.textContent).toContain('Playing:');
                const sides = editTournamentComponent.querySelector('div:nth-child(2)');
                expect(sides.textContent).toContain('SIDE 1');
            });

            it('super league options when single round', async () => {
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .host('HOST')
                    .opponent('OPPONENT')
                    .gender('men')
                    .singleRound()
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([season]),
                    teams: [],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(false);
                const superLeagueOptions = context.container.querySelector('div[datatype="tournament-options"]');
                expect(superLeagueOptions).toBeTruthy();
                const hostInput = superLeagueOptions.querySelector('input[name="host"]') as HTMLInputElement;
                const opponentInput = superLeagueOptions.querySelector('input[name="opponent"]') as HTMLInputElement;
                expect(hostInput).toBeTruthy();
                expect(hostInput.value).toEqual('HOST');
                expect(opponentInput).toBeTruthy();
                expect(opponentInput.value).toEqual('OPPONENT');
                expect(superLeagueOptions.querySelector('div[datatype="superleague-gender"] .dropdown-menu .active').textContent).toEqual('Men');
            });

            it('no super league options when not single round', async () => {
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .address('ADDRESS')
                    .type('TYPE')
                    .notes('NOTES')
                    .host('HOST')
                    .opponent('OPPONENT')
                    .gender('men')
                    .accoladesCount()
                    .addTo(tournamentDataLookup)
                    .build();
                const divisionData = divisionDataBuilder().build();
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([season]),
                    teams: [],
                    divisions: [division],
                }, false);

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('div[data-options-for="superleague"]')).toBeFalsy();
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
        const canExportAccount: UserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                manageTournaments: true,
                managePlayers: true,
                recordScoresAsYouGo: true,
                exportData: true,
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            const team = teamBuilder('TEAM').forSeason(tournamentData.seasonId, divisionData.id).build()
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
                teams: toMap([team]),
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, 'Add player'));
            const addPlayerDialog = context.container.querySelector('.modal-dialog');

            await doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER', context.user);
            await doSelectOption(addPlayerDialog.querySelector('.dropdown-menu'), 'TEAM');
            await doClick(findButton(addPlayerDialog, 'Add player'));

            expect(reportedError.hasError()).toEqual(false);
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);

            const address = context.container.querySelector('.content-background > div:nth-child(2)');
            await doChange(address, 'input', 'NEW ADDRESS', context.user);
            const type = context.container.querySelector('.content-background > div:nth-child(3)');
            await doChange(type, 'input', 'NEW TYPE', context.user);
            const notes = context.container.querySelector('.content-background > div:nth-child(4)');
            await doChange(notes, 'textarea', 'NEW NOTES', context.user);
            const accoladesCountAndDivision = context.container.querySelector('.content-background > div:nth-child(5)');
            const superLeagueOptions = context.container.querySelector('div[datatype="tournament-options"]');
            await doClick(accoladesCountAndDivision, 'input[type="checkbox"]');
            await doSelectOption(accoladesCountAndDivision.querySelector('div[datatype="tournament-division"] .dropdown-menu'), 'All divisions');
            await doSelectOption(superLeagueOptions.querySelector('div[datatype="superleague-gender"] .dropdown-menu'), 'Women');
            await doChange(superLeagueOptions, 'input[name="host"]', 'HOST', context.user);
            await doChange(superLeagueOptions, 'input[name="opponent"]', 'OPPONENT', context.user);

            await assertDataChange(
                tournamentData,
                {
                    id: tournamentData.id,
                    address: 'NEW ADDRESS',
                    type: 'NEW TYPE',
                    notes: 'NEW NOTES',
                    accoladesCount: false,
                    divisionId: null,
                    singleRound: true,
                    host: 'HOST',
                    opponent: 'OPPONENT',
                    gender: 'women',
                });
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
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
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doSelectOption(context.container.querySelector('table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');

            await doClick(findButton(context.container, 'Save'));

            expect(alert).toEqual('Add the (new) match before saving, otherwise it would be lost.\n' +
                '\n' +
                'Final: SIDE 1 vs SIDE 2');
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
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doSelectOption(context.container.querySelector('table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('table tr td:nth-child(6)'), '➕'));

            await doClick(findButton(context.container, 'Save'));

            expect(alert).toBeFalsy();
            expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        });

        it('produces correct match option defaults when no bestOf', async () => {
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
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doSelectOption(context.container.querySelector('table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('table tr td:nth-child(6)'), '➕'));

            await doClick(findButton(context.container, 'Save'));

            expect(alert).toBeFalsy();
            const round = updatedTournamentData[0].round;
            expect(round.matchOptions).toEqual([{ numberOfLegs: 5, startingScore: 501 }]);
        });

        it('produces correct match option defaults', async () => {
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
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doSelectOption(context.container.querySelector('table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('table tr td:nth-child(6)'), '➕'));

            await doClick(findButton(context.container, 'Save'));

            expect(alert).toBeFalsy();
            const round = updatedTournamentData[0].round;
            expect(round.matchOptions).toEqual([{ numberOfLegs: 7, startingScore: 501 }]);
        });

        it('can export tournament and sayg data with no round', async () => {
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: canExportAccount,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                }
            });
            // NOTE: requestedScoreAsYouGo should NOT be present, to prevent export of ALL records
        });

        it('can export tournament and sayg data with round', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .saygId(saygId)
                        .sideA('A')
                        .sideB('B'))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: canExportAccount,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    recordedScoreAsYouGo: [saygId],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                }
            });
        });

        it('can export tournament and sayg data with sub rounds', async () => {
            const saygId1 = createTemporaryId();
            const saygId2 = createTemporaryId();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .saygId(saygId1)
                        .sideA('A')
                        .sideB('B'))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m
                            .saygId(saygId2)
                            .sideA('A')
                            .sideB('B'))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))))
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: canExportAccount,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    recordedScoreAsYouGo: [saygId1, saygId2],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                }
            });
        });

        it('can export tournament data for cross-divisional tournament', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: canExportAccount,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                }
            });
        });

        it('can export tournament data and team data for team sides', async () => {
            const team = teamBuilder('TEAM').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.teamId(team.id))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: canExportAccount,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                    team: [team.id],
                }
            });
        });

        it('can export tournament data and team data for sides with players', async () => {
            const playerId = createTemporaryId();
            const team = teamBuilder('TEAM')
                .forSeason(season, null, [playerBuilder('PLAYER', playerId).build()])
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.withPlayer(undefined, playerId))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: canExportAccount,
                seasons: toMap([season]),
                teams: [team],
                divisions: [division],
            }, false);
            (window as any).open = noop;
            expect(reportedError.hasError()).toEqual(false);

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                    team: [team.id],
                }
            });
        });

        it('excludes no-show sides from 180 selection', async () => {
            const side1Player = playerBuilder('SIDE 1 PLAYER').build();
            const side2Player = playerBuilder('SIDE 2 PLAYER').build();
            const side1 = sideBuilder('SIDE 1').withPlayer(side1Player).build();
            const side2 = sideBuilder('SIDE 2 (no show)').noShow().withPlayer(side2Player).build();
            const team = teamBuilder('TEAM')
                .forSeason(season, null, [ side1Player, side2Player ])
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side1)
                .withSide(side2)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: canExportAccount,
                seasons: toMap([season]),
                teams: [team],
                divisions: [division],
            }, false);

            const accolades = context.container.querySelector('div > div > table:nth-child(4)');
            const oneEighties = accolades.querySelector('tbody tr:first-child td:nth-child(1)');
            const options = Array.from(oneEighties.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(options.map(o => o.textContent.trim())).toEqual(['', 'SIDE 1 PLAYER']);
        });

        it('excludes no-show sides from hi-check selection', async () => {
            const side1Player = playerBuilder('SIDE 1 PLAYER').build();
            const side2Player = playerBuilder('SIDE 2 PLAYER').build();
            const side1 = sideBuilder('SIDE 1').withPlayer(side1Player).build();
            const side2 = sideBuilder('SIDE 2 (no show)').noShow().withPlayer(side2Player).build();
            const team = teamBuilder('TEAM')
                .forSeason(season, null, [ side1Player, side2Player])
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side1)
                .withSide(side2)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: canExportAccount,
                seasons: toMap([season]),
                teams: [team],
                divisions: [division],
            }, false);

            const accolades = context.container.querySelector('div > div > table:nth-child(4)');
            const hiChecks = accolades.querySelector('tbody tr:first-child td:nth-child(2)');
            const options = Array.from(hiChecks.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(options.map(o => o.textContent.trim())).toEqual(['', 'SIDE 1 PLAYER']);
        });

        it('can patch data with sayg score for match', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const playerB = playerBuilder('PLAYER B').build();
            const sayg = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(451))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(200))
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📊'));
            expect(reportedError.hasError()).toEqual(false);
            apiResponse = {success: true, result: tournamentData};

            await doChange(context.container, 'input[data-score-input="true"]', '50', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            expect(reportedError.hasError()).toEqual(false);
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
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(200))
                    .currentThrow('home')
                    .playerSequence('home', 'away'))
                .scores(0, 0)
                .addTo(saygDataLookup)
                .build();
            const sideA = sideBuilder('A').withPlayer(playerA).build();
            const sideB = sideBuilder('B').withPlayer(playerB).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📊'));
            expect(reportedError.hasError()).toEqual(false);
            apiResponse = {success: true, result: tournamentData};

            await doChange(context.container, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            expect(reportedError.hasError()).toEqual(false);
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
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(401))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(200))
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📊'));
            expect(reportedError.hasError()).toEqual(false);
            apiResponse = {success: true, result: tournamentData};

            await doChange(context.container, 'input[data-score-input="true"]', '100', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            expect(reportedError.hasError()).toEqual(false);
            expect(patchedTournamentData).toEqual([{
                data: {
                    additionalOver100Checkout: {
                        id: playerA.id,
                        name: playerA.name,
                        notes: '100',
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
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(200))
                    .currentThrow('home')
                    .playerSequence('home', 'away'))
                .scores(0, 0)
                .addTo(saygDataLookup)
                .build();
            const sideA = sideBuilder('A').withPlayer(playerA).build();
            const sideB = sideBuilder('B').withPlayer(playerB).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
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
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            await doClick(findButton(context.container, '📊'));
            expect(reportedError.hasError()).toEqual(false);
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doChange(context.container, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            expect(reportedError.hasError()).toEqual(false);
            expect(patchedTournamentData).not.toBeNull();
            expect(context.container.textContent).toContain('Could not save tournament details');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can add 180 for player in newly added side', async () => {
            const playerA = playerBuilder('PLAYER A').build();
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
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA ])
                .build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: toMap([season]),
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(findButton(context.container.querySelector('div:nth-child(6)'), '➕')); // open add side dialog
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(dialog.querySelector('.list-group-item')); // click on a player
            await doClick(findButton(dialog, 'Save')); // close the dialog
            expect(reportedError.hasError()).toEqual(false);

            const oneEightiesDropdown = context.container.querySelector('td[datatype="180s"] .dropdown-menu');
            const oneEightyPlayers = Array.from(oneEightiesDropdown.querySelectorAll('.dropdown-item'));
            expect(oneEightyPlayers.map(p => p.textContent)).toContain('PLAYER A');
        });

        it('can add hi-check for player in newly added side', async () => {
            const playerA = playerBuilder('PLAYER A').build();
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
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA ])
                .build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: toMap([season]),
                teams: [team],
                divisions: [division],
            }, false);

            await doClick(findButton(context.container.querySelector('div:nth-child(6)'), '➕')); // open add side dialog
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(dialog.querySelector('.list-group-item')); // click on a player
            await doClick(findButton(dialog, 'Save')); // close the dialog
            expect(reportedError.hasError()).toEqual(false);

            const hiCheckDropdown = context.container.querySelector('td[datatype="hiChecks"] .dropdown-menu');
            const hiCheckPlayers = Array.from(hiCheckDropdown.querySelectorAll('.dropdown-item'));
            expect(hiCheckPlayers.map(p => p.textContent)).toContain('PLAYER A');
        });

        it('cannot add 180 for player in newly removed side', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .withSide((s: ITournamentSideBuilder) => s.withPlayer(playerA))
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA ])
                .build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: toMap([season]),
                teams: [team],
                divisions: [division],
            }, false);
            window.confirm = () => true;

            await doClick(findButton(context.container.querySelector('div:nth-child(6)'), '✏️')); // open edit side dialog
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Delete side')); // delete the side
            expect(reportedError.hasError()).toEqual(false);

            const oneEightyDropdown = context.container.querySelector('td[datatype="180s"] .dropdown-menu');
            expect(oneEightyDropdown).toBeFalsy();
        });

        it('cannot add hi-check for player in newly removed side', async () => {
            const playerA = playerBuilder('PLAYER A').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .withSide((s: ITournamentSideBuilder) => s.withPlayer(playerA))
                .round((r: ITournamentRoundBuilder) => r)
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [ playerA ])
                .build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: account,
                seasons: toMap([season]),
                teams: [team],
                divisions: [division],
            }, false);
            window.confirm = () => true;

            await doClick(findButton(context.container.querySelector('div:nth-child(6)'), '✏️')); // open edit side dialog
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Delete side')); // delete the side
            expect(reportedError.hasError()).toEqual(false);

            const hiCheckDropdown = context.container.querySelector('td[datatype="hiChecks"] .dropdown-menu');
            expect(hiCheckDropdown).toBeFalsy();
        });
    });
});