// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, doChange, findButton} from "../../../tests/helpers";
import React from "react";
import {Tournament} from "./Tournament";
import {createTemporaryId, toMap, any} from "../../../Utilities";

describe('Tournament', () => {
    const EMPTY_ID = '00000000-0000-0000-0000-000000000000';
    let context;
    let reportedError;
    let teamsReloaded;
    let divisionDataLookup;
    let tournamentDataLookup;
    let updatedTournamentData;
    let createdPlayer;
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
        update: async (data) => {
            updatedTournamentData.push(data);
            return {
                success: true,
            };
        }
    };
    const playerApi = {
        create: async (seasonId, teamId, playerDetails) => {
            createdPlayer = { seasonId, teamId, playerDetails };
            return {
                success: true,
            };
        }
    }

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
        cleanUp(context);
    });

    async function renderComponent(tournamentId, scenario, appLoading) {
        updatedTournamentData = [];
        reportedError = null;
        teamsReloaded = false;
        createdPlayer = null;
        context = await renderApp(
            {
                divisionApi,
                tournamentApi,
                playerApi
            },
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
            },
            (<Tournament />),
            '/test/:tournamentId',
            '/test/' + tournamentId);
    }

    async function assertDataChange(existingData, expectedChange) {
        await doClick(context.container, '.light-background > button:nth-child(7)');
        expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
        expect(updatedTournamentData.shift()).toEqual(
            Object.assign({}, existingData, expectedChange));
    }

    const division = {
        id: createTemporaryId(),
        name: 'DIVISION',
    };
    const season = {
        id: createTemporaryId(),
        name: 'SEASON',
        startDate: '2023-01-02T00:00:00',
        endDate: '2023-05-02T00:00:00',
        divisions: [ division ],
    };

    describe('renders', () => {
        describe('when logged out', () => {
            const account = null;

            it('error when no seasons', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([]),
                    teams: [],
                    divisions: [ division ],
                }, false);

                expect(reportedError).toEqual('No seasons found');
            });

            it('loading', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, true);

                expect(reportedError).toBeNull();
                const container = context.container.querySelector('.light-background');
                expect(container).toBeTruthy();
                expect(container.className).toContain('loading-background');
            });

            it('when tournament not found', async () => {
                const id = createTemporaryId();
                tournamentDataLookup = {};
                tournamentDataLookup[id] = null;

                await renderComponent(id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, false);

                expect(reportedError).toEqual('Tournament could not be found');
                expect(context.container.textContent).toContain('Tournament not found');
            });

            it('when tournament season not found', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: createTemporaryId(), // non-existent season id
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, false);

                expect(reportedError).not.toBeNull();
                expect(reportedError.message).toEqual('Could not find the season for this tournament');
            });

            it('tournament without any sides', async () => {
                const teamPlayer = {
                    id: createTemporaryId(),
                    name: 'PLAYER',
                };
                const team = {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    seasons: [{
                        seasonId: season.id,
                        divisionId: division.id,
                        players: [ teamPlayer ],
                    }],
                };
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [ team ],
                    divisions: [ division ],
                }, false);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.light-background > p');
                expect(heading).toBeTruthy();
                expect(heading.textContent).toContain('TYPE At ADDRESS on 2 Jan');
                const notes = context.container.querySelector('.light-background > div.alert');
                expect(notes).toBeTruthy();
                expect(notes.textContent).toContain('NOTES');
            });

            it('tournament with team sides only', async () => {
                const teamPlayer = {
                    id: createTemporaryId(),
                    name: 'PLAYER',
                };
                const team = {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    seasons: [{
                        seasonId: season.id,
                        divisionId: division.id,
                        players: [ teamPlayer ],
                    }],
                };
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [ {
                        id: createTemporaryId(),
                        teamId: team.id,
                        players: []
                    }],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [ team ],
                    divisions: [ division ],
                }, false);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.light-background > p');
                expect(heading).toBeTruthy();
                expect(heading.textContent).toContain('TYPE At ADDRESS on 2 Jan');
                const notes = context.container.querySelector('.light-background > div.alert');
                expect(notes).toBeTruthy();
                expect(notes.textContent).toContain('NOTES');
            });

            it('tournament with sides and players', async () => {
                const teamPlayer = {
                    id: createTemporaryId(),
                    name: 'PLAYER',
                };
                const team = {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    seasons: [{
                        seasonId: season.id,
                        divisionId: division.id,
                        players: [ teamPlayer ],
                    }],
                };
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [ {
                        id: createTemporaryId(),
                        name: 'SIDE 1',
                        players: [ {
                            id: teamPlayer.id,
                            name: teamPlayer.name,
                            divisionId: division.id,
                        }],
                        teamId: team.id,
                    } ],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [ team ],
                    divisions: [ division ],
                }, false);

                expect(reportedError).toBeNull();
                const editTournamentComponent = context.container.querySelector('.light-background > div:nth-child(3)');
                expect(editTournamentComponent).toBeTruthy();
                expect(editTournamentComponent.textContent).toContain('Playing:');
                const sides = editTournamentComponent.querySelector('div:nth-child(2)');
                expect(sides.textContent).toContain('SIDE 1');
            });
        });

        describe('when logged in', () => {
            const account = {
                access: {
                    manageGames: true,
                    managePlayers: true,
                    manageScores: true,
                }
            };

            it('error when no seasons', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([]),
                    teams: [],
                    divisions: [ division ],
                }, false);

                expect(reportedError).toEqual('No seasons found');
            });

            it('loading', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(tournamentData.divisionId, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, true);

                expect(reportedError).toBeNull();
                const container = context.container.querySelector('.light-background');
                expect(container).toBeTruthy();
                expect(container.className).toContain('loading-background');
            });

            it('tournament without any sides', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, false);

                expect(reportedError).toBeNull();
                // address
                const address = context.container.querySelector('.light-background > div:nth-child(1)');
                expect(address).toBeTruthy();
                expect(address.textContent).toContain('Address');
                expect(address.querySelector('input').value).toEqual('ADDRESS');
                // type
                const type = context.container.querySelector('.light-background > div:nth-child(2)');
                expect(type).toBeTruthy();
                expect(type.textContent).toContain('Type');
                expect(type.querySelector('input').value).toEqual('TYPE');
                // notes
                const notes = context.container.querySelector('.light-background > div:nth-child(3)');
                expect(notes).toBeTruthy();
                expect(notes.textContent).toContain('Notes');
                expect(notes.querySelector('textarea').value).toEqual('NOTES');
                // accolades qualify
                const accoladesQualifyAndDivision = context.container.querySelector('.light-background > div:nth-child(4)');
                expect(accoladesQualifyAndDivision).toBeTruthy();
                expect(accoladesQualifyAndDivision.textContent).toContain('Include 180s and Hi-checks in players table?');
                expect(accoladesQualifyAndDivision.querySelector('input').checked).toEqual(true);
                // division
                expect(accoladesQualifyAndDivision.textContent).toContain('Division:');
                expect(accoladesQualifyAndDivision.querySelector('.dropdown-item.active').textContent).toEqual('DIVISION');
            });

            it('tournament with sides and players', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [ {
                        id: createTemporaryId(),
                        name: 'SIDE 1',
                        players: [ {
                            id: createTemporaryId(),
                            name: 'PLAYER',
                            divisionId: division.id,
                        }],
                        teamId: null,
                    } ],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, false);

                expect(reportedError).toBeNull();
                const editTournamentComponent = context.container.querySelector('.light-background > div:nth-child(5)');
                expect(editTournamentComponent).toBeTruthy();
                expect(editTournamentComponent.textContent).toContain('Playing:');
                const sides = editTournamentComponent.querySelector('div:nth-child(2)');
                expect(sides.textContent).toContain('SIDE 1');
            });

            it('can open add player dialog', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, false);

                const addPlayerButton = context.container.querySelector('.light-background > button:nth-child(8)');
                expect(addPlayerButton).toBeTruthy();
                expect(addPlayerButton.textContent).toEqual('Add player');
                await doClick(addPlayerButton);

                const addPlayerDialog = context.container.querySelector('.modal-dialog');
                expect(addPlayerDialog).toBeTruthy();
                expect(addPlayerDialog.textContent).toContain('Add player');
            });

            it('can add players', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
                const team = {
                    id: createTemporaryId(),
                    name: 'TEAM',
                    seasons: [{
                        seasonId: tournamentData.seasonId,
                        divisionId: divisionData.id,
                        players: [],
                    }],
                };
                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: toMap([team]),
                    divisions: [ division ],
                }, false);
                const addPlayerButton = context.container.querySelector('.light-background > button:nth-child(8)');
                expect(addPlayerButton).toBeTruthy();
                expect(addPlayerButton.textContent).toEqual('Add player');
                await doClick(addPlayerButton);
                const addPlayerDialog = context.container.querySelector('.modal-dialog');

                doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER');
                console.log(addPlayerDialog.innerHTML);
                await doClick(addPlayerDialog, '.dropdown-menu .dropdown-item:not(.active)'); //select a team
                await doClick(findButton(addPlayerDialog, 'Add player'));

                expect(reportedError).toBeNull();
                expect(createdPlayer).not.toBeNull();
                expect(createdPlayer.teamId).toEqual(team.id);
                expect(createdPlayer.seasonId).toEqual(tournamentData.seasonId);
                expect(createdPlayer.playerDetails).toEqual({
                    name: 'NEW PLAYER',
                });
            });

            it('can cancel add player dialog', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, false);
                const addPlayerButton = context.container.querySelector('.light-background > button:nth-child(8)');
                expect(addPlayerButton).toBeTruthy();
                expect(addPlayerButton.textContent).toEqual('Add player');
                await doClick(addPlayerButton);

                const addPlayerDialog = context.container.querySelector('.modal-dialog');
                await doClick(findButton(addPlayerDialog, 'Cancel'));

                expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
            });

            it('can update details', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);
                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, false);

                const address = context.container.querySelector('.light-background > div:nth-child(1)');
                doChange(address, 'input', 'NEW ADDRESS');
                const type = context.container.querySelector('.light-background > div:nth-child(2)');
                doChange(type, 'input', 'NEW TYPE');
                const notes = context.container.querySelector('.light-background > div:nth-child(3)');
                doChange(notes, 'textarea', 'NEW NOTES');
                const accoladesQualifyAndDivision = context.container.querySelector('.light-background > div:nth-child(4)');
                await doClick(accoladesQualifyAndDivision, 'input');
                const divisionOption = accoladesQualifyAndDivision.querySelector('.dropdown-item:not(.active)');
                expect(divisionOption.textContent).toEqual('All divisions');
                await doClick(divisionOption);

                await assertDataChange(
                    tournamentData,
                    {
                        address: 'NEW ADDRESS',
                        type: 'NEW TYPE',
                        notes: 'NEW NOTES',
                        accoladesQualify: false,
                        divisionId: null,
                    });
            });

            it('can save changes', async () => {
                const tournamentData = {
                    id: createTemporaryId(),
                    seasonId: season.id,
                    divisionId: division.id,
                    date: '2023-01-02T00:00:00',
                    sides: [],
                    address: 'ADDRESS',
                    type: 'TYPE',
                    notes: 'NOTES',
                    accoladesQualify: true,
                    round: null,
                    oneEighties: null,
                    over100Checkouts: null,
                };
                const divisionData = {
                    fixtures: [],
                };
                tournamentDataLookup = {};
                tournamentDataLookup[tournamentData.id] = tournamentData;
                expectDivisionDataRequest(EMPTY_ID, tournamentData.seasonId, divisionData);

                await renderComponent(tournamentData.id, {
                    account,
                    seasons: toMap([ season ]),
                    teams: [],
                    divisions: [ division ],
                }, false);
                const saveButton = context.container.querySelector('.light-background > button:nth-child(7)');
                expect(saveButton).toBeTruthy();
                expect(saveButton.textContent).toEqual('Save');

                await doClick(saveButton);

                expect(updatedTournamentData.length).toBeGreaterThanOrEqual(1);
            });
        });
    });
});