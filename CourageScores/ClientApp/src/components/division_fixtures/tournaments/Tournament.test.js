// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, doSelectOption, findButton, noop, renderApp} from "../../../helpers/tests";
import React from "react";
import {Tournament} from "./Tournament";
import {any, toMap} from "../../../helpers/collections";
import {createTemporaryId, EMPTY_ID} from "../../../helpers/projection";
import {
    divisionBuilder, divisionDataBuilder, playerBuilder, saygBuilder,
    seasonBuilder,
    sideBuilder,
    teamBuilder,
    tournamentBuilder
} from "../../../helpers/builders";

describe('Tournament', () => {
    let context;
    let reportedError;
    let teamsReloaded;
    let divisionDataLookup;
    let tournamentDataLookup;
    let updatedTournamentData;
    let patchedTournamentData;
    let saygDataLookup;
    let createdPlayer;
    let exportRequest;
    let apiResponse;

    const divisionApi = {
        data: async (divisionId, seasonId) => {
            const key = `${divisionId}_${seasonId}`;
            if (any(Object.keys(divisionDataLookup), k => k === key)) {
                return divisionDataLookup[key];
            }

            throw new Error('Unexpected request for division data: ' + key);
        }
    };
    const tournamentApi = {
        get: async (id) => {
            if (any(Object.keys(tournamentDataLookup), k => k === id)) {
                return tournamentDataLookup[id];
            }

            throw new Error('Unexpected request for tournament data: ' + id);
        },
        update: async (data, lastUpdated) => {
            updatedTournamentData.push({data, lastUpdated});
            return apiResponse || {success: true};
        },
        patch: async (id, data) => {
            patchedTournamentData.push({id, data});
            return apiResponse || {success: true};
        },
    };
    const playerApi = {
        create: async (divisionId, seasonId, teamId, playerDetails) => {
            createdPlayer = {divisionId, seasonId, teamId, playerDetails};
            return apiResponse || {success: true};
        }
    };
    const dataApi = {
        export: async (request) => {
            exportRequest = request;
            return {success: true, result: {zip: 'content'}};
        }
    };
    const saygApi = {
        get: async (id) => {
            if (any(Object.keys(saygDataLookup), k => k === id)) {
                return saygDataLookup[id];
            }

            throw new Error('Unexpected request for sayg data: ' + id);
        },
        upsert: async (data) => {
            return {
                success: true,
                result: data,
            };
        }
    };

    function expectDivisionDataRequest(divisionId, seasonId, data) {
        if (!divisionDataLookup) {
            divisionDataLookup = {};
        }

        const key = `${divisionId}_${seasonId}`;
        divisionDataLookup[key] = data;
    }

    afterEach(() => {
        divisionDataLookup = {};
        tournamentDataLookup = {};
        saygDataLookup = {};
        cleanUp(context);
    });

    async function renderComponent(tournamentId, scenario, appLoading) {
        updatedTournamentData = [];
        patchedTournamentData = [];
        reportedError = null;
        teamsReloaded = false;
        createdPlayer = null;
        exportRequest = null;
        apiResponse = null;
        context = await renderApp(
            {
                divisionApi,
                tournamentApi,
                playerApi,
                dataApi,
                saygApi,
            },
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
                appLoading,
                account: scenario.account,
                seasons: scenario.seasons,
                teams: scenario.teams,
                reloadTeams: async () => {
                    teamsReloaded = true;
                    return scenario.teams;
                },
                divisions: scenario.divisions,
                reportClientSideException: noop,
            },
            (<Tournament/>),
            '/test/:tournamentId',
            '/test/' + tournamentId);
    }

    async function assertDataChange(existingData, expectedChange) {
        await doClick(findButton(context.container, 'Save'));
        expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        const update = updatedTournamentData.shift();
        expect(update.lastUpdated).toEqual(existingData.updated || '<updated> not defined in existing data');
        expect(update.data).toEqual(
            Object.assign({}, existingData, expectedChange));
    }

    const division = divisionBuilder('DIVISION').build();
    const season = seasonBuilder('SEASON')
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

                expect(reportedError).toEqual('No seasons found');
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

                expect(reportedError).toBeNull();
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

                expect(reportedError).toEqual('Tournament could not be found');
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

                expect(reportedError).not.toBeNull();
                expect(reportedError.message).toEqual('Could not find the season for this tournament');
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

                expect(reportedError).toBeNull();
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
                    .withSide(s => s.teamId(team.id))
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

                expect(reportedError).toBeNull();
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
                    .withSide(s => s
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

                expect(reportedError).toBeNull();
                const printableSheet = context.container.querySelector('div[datatype="printable-sheet"]');
                expect(printableSheet).toBeTruthy();
            });
        });

        describe('when logged in', () => {
            const account = {
                access: {
                    manageTournaments: true,
                    managePlayers: true,
                    manageScores: true,
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

                expect(reportedError).toEqual('No seasons found');
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

                expect(reportedError).toBeNull();
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

                expect(reportedError).toBeNull();
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
                expect(accoladesCountAndDivision.textContent).toContain('Division:');
                expect(accoladesCountAndDivision.querySelector('.dropdown-item.active').textContent).toEqual('DIVISION');
            });

            it('tournament with sides and players', async () => {
                const tournamentData = tournamentBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .date('2023-01-02T00:00:00')
                    .withSide(s => s.name('SIDE 1').withPlayer('PLAYER', null, division.id))
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

                expect(reportedError).toBeNull();
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

                expect(reportedError).toBeNull();
                const superLeagueOptions = context.container.querySelector('div[data-options-for="superleague"]');
                expect(superLeagueOptions).toBeTruthy();
                expect(superLeagueOptions.querySelector(' input[name="host"]')).toBeTruthy();
                expect(superLeagueOptions.querySelector(' input[name="host"]').value).toEqual('HOST');
                expect(superLeagueOptions.querySelector(' input[name="opponent"]')).toBeTruthy();
                expect(superLeagueOptions.querySelector(' input[name="opponent"]').value).toEqual('OPPONENT');
                expect(superLeagueOptions.querySelector(' .dropdown-menu .active').textContent).toEqual('Men');
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

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('div[data-options-for="superleague"]')).toBeFalsy();
            });
        });
    });

    describe('interactivity', () => {
        const account = {
            access: {
                manageTournaments: true,
                managePlayers: true,
                manageScores: true,
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

            expect(reportedError).toBeNull();
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
            const superLeagueOptions = context.container.querySelector('div[data-options-for="superleague"]');
            await doClick(accoladesCountAndDivision, 'input[type="checkbox"]');
            await doSelectOption(accoladesCountAndDivision.querySelector('.dropdown-menu'), 'All divisions');
            await doSelectOption(superLeagueOptions.querySelector('.dropdown-menu'), 'Women');
            await doChange(superLeagueOptions, 'input[name="host"]', 'HOST', context.user);
            await doChange(superLeagueOptions, 'input[name="opponent"]', 'OPPONENT', context.user);

            await assertDataChange(
                tournamentData,
                {
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
                .withSide(s => s.name('SIDE 1'))
                .withSide(s => s.name('SIDE 2'))
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
            let alert;
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
                .withSide(s => s.name('SIDE 1'))
                .withSide(s => s.name('SIDE 2'))
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
            let alert;
            window.alert = (msg) => alert = msg;
            await doSelectOption(context.container.querySelector('table tr td:nth-child(1) .dropdown-menu'), 'SIDE 1');
            await doSelectOption(context.container.querySelector('table tr td:nth-child(5) .dropdown-menu'), 'SIDE 2');
            await doClick(findButton(context.container.querySelector('table tr td:nth-child(6)'), '➕'));

            await doClick(findButton(context.container, 'Save'));

            expect(alert).toBeFalsy();
            expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
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
                account: {access: Object.assign({exportData: true}, account.access)},
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            window.open = noop;

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
                .round(r => r
                    .withMatch(m => m
                        .saygId(saygId)
                        .sideA('A')
                        .sideB('B')))
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: {access: Object.assign({exportData: true}, account.access)},
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            window.open = noop;

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
                .round(r => r
                    .withMatch(m => m
                        .saygId(saygId1)
                        .sideA('A')
                        .sideB('B'))
                    .round(r => r
                        .withMatch(m => m
                            .saygId(saygId2)
                            .sideA('A')
                            .sideB('B'))))
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: {access: Object.assign({exportData: true}, account.access)},
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            window.open = noop;

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
                account: {access: Object.assign({exportData: true}, account.access)},
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            window.open = noop;

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
                .withSide(s => s.teamId(team.id))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: {access: Object.assign({exportData: true}, account.access)},
                seasons: toMap([season]),
                teams: [],
                divisions: [division],
            }, false);
            window.open = noop;

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
                .withSide(s => s.withPlayer(undefined, playerId))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .addTo(tournamentDataLookup)
                .build();
            const divisionData = divisionDataBuilder().build();
            expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
            await renderComponent(tournamentData.id, {
                account: {access: Object.assign({exportData: true}, account.access)},
                seasons: toMap([season]),
                teams: [team],
                divisions: [division],
            }, false);
            window.open = noop;
            expect(reportedError).toBeNull();

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
                account: {access: Object.assign({exportData: true}, account.access)},
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
                account: {access: Object.assign({exportData: true}, account.access)},
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
                .withLeg('0', l => l
                    .startingScore(501)
                    .home(c => c.withThrow(100).score(451))
                    .away(c => c.withThrow(100).score(200))
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
                .round(r => r
                    .withMatch(m => m
                        .saygId(sayg.id)
                        .sideA(sideA)
                        .sideB(sideB)))
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
            expect(reportedError).toBeNull();

            await doChange(context.container, 'input[data-score-input="true"]', '50', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            expect(reportedError).toBeNull();
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
                .withLeg('0', l => l
                    .startingScore(501)
                    .home(c => c.withThrow(100).score(100))
                    .away(c => c.withThrow(100).score(200))
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
                .round(r => r
                    .withMatch(m => m
                        .saygId(sayg.id)
                        .sideA(sideA)
                        .sideB(sideB)))
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
            expect(reportedError).toBeNull();

            await doChange(context.container, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            expect(reportedError).toBeNull();
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
                .withLeg('0', l => l
                    .startingScore(501)
                    .home(c => c.withThrow(100).score(401))
                    .away(c => c.withThrow(100).score(200))
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
                .round(r => r
                    .withMatch(m => m
                        .saygId(sayg.id)
                        .sideA(sideA)
                        .sideB(sideB)))
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
            expect(reportedError).toBeNull();

            await doChange(context.container, 'input[data-score-input="true"]', '100', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(patchedTournamentData).toEqual([{
                data: {
                    additionalOver100Checkout: {
                        id: playerA.id,
                        name: playerA.name,
                        notes: '100',
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
                .withLeg('0', l => l
                    .startingScore(501)
                    .home(c => c.withThrow(100).score(100))
                    .away(c => c.withThrow(100).score(200))
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
                .round(r => r
                    .withMatch(m => m
                        .saygId(sayg.id)
                        .sideA(sideA)
                        .sideB(sideB)))
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
            expect(reportedError).toBeNull();
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doChange(context.container, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(patchedTournamentData).not.toBeNull();
            expect(context.container.textContent).toContain('Could not save tournament details');
            expect(context.container.textContent).toContain('SOME ERROR');
        });
    });
});