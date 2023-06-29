// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton, doSelectOption} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {renderDate} from "../../helpers/rendering";
import React from "react";
import {DivisionFixtureDate} from "./DivisionFixtureDate";
import {DivisionDataContainer} from "../DivisionDataContainer";

describe('DivisionFixtureDate', () => {
    let context;
    let reportedError;
    let startingToAddNote;
    let showPlayers;
    let editNote;
    let newFixtures;
    let tournamentChanged;

    async function startAddNote(date) {
        startingToAddNote = date;
    }
    async function setShowPlayers(newShowPlayers) {
        showPlayers = newShowPlayers;
    }
    async function setEditNote() {
        editNote = true;
    }
    async function setNewFixtures(updatedFixtures) {
        newFixtures = updatedFixtures;
    }
    async function onTournamentChanged() {
        tournamentChanged = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, divisionData, account) {
        newFixtures = null;
        startingToAddNote = null;
        showPlayers = null;
        editNote = null;
        tournamentChanged = null;
        reportedError = null;
        context = await renderApp(
            { },
            { name: 'Courage Scores' },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account
            },
            (<DivisionDataContainer {...divisionData}>
                <DivisionFixtureDate
                    {...props}
                    startAddNote={startAddNote}
                    setEditNote={setEditNote}
                    setShowPlayers={setShowPlayers}
                    setNewFixtures={setNewFixtures}
                    onTournamentChanged={onTournamentChanged} />
            </DivisionDataContainer>));
    }

    function getDate(daysFromToday) {
        let date = new Date();
        date.setMonth(date.getMonth() + daysFromToday);
        return date.toISOString();
    }

    describe('when logged out', () => {
        const team = {
            id: createTemporaryId(),
            name: 'TEAM',
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const account = null;

        it('renders league fixtures', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: createTemporaryId(),
                    homeTeam: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    }
                }],
                tournamentFixtures: [],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            expect(heading.textContent).not.toContain('Qualifier');
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.innerHTML).toContain('HOME');
            expect(row.innerHTML).toContain('Bye');
        });

        it('renders league qualifier/knockout fixtures', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: createTemporaryId(),
                    isKnockout: true,
                    homeTeam: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    }
                }],
                tournamentFixtures: [],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            expect(heading.textContent).toContain('Qualifier');
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.innerHTML).toContain('HOME');
            expect(row.innerHTML).toContain('Bye');
        });

        it('renders tournament fixtures', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [{
                    id: createTemporaryId(),
                    type: 'TYPE',
                    address: 'ADDRESS',
                }],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            expect(heading.textContent).not.toContain('Qualifier');
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.textContent).toContain('TYPE at ADDRESS');
        });

        it('renders tournament fixtures with winner', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [{
                    id: createTemporaryId(),
                    type: 'TYPE',
                    address: 'ADDRESS',
                    winningSide: {
                        id: createTemporaryId(),
                        name: 'WINNER'
                    },
                }],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            expect(heading.textContent).not.toContain('Qualifier');
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.textContent).toContain('TYPE at ADDRESS');
            expect(row.textContent).toContain('Winner: WINNER');
        });

        it('renders notes', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [],
                notes: [{
                    id: createTemporaryId(),
                    note: 'NOTE'
                }],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(0);
            const alert = context.container.querySelector('div.alert');
            expect(alert).toBeTruthy();
            expect(alert.textContent).toContain('NOTE');
        });

        it('renders past dates', async () => {
            const fixtureDate = {
                date: getDate(-1),
                fixtures: [],
                tournamentFixtures: [],
                notes: [{
                    id: createTemporaryId(),
                    note: 'NOTE'
                }],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const component = context.container.querySelector('div');
            expect(component).toBeTruthy();
            expect(component.className).not.toContain('text-secondary-50');
            expect(component.className).not.toContain('text-primary');
        });

        it('renders today', async () => {
            const fixtureDate = {
                date: getDate(0),
                fixtures: [],
                tournamentFixtures: [],
                notes: [{
                    id: createTemporaryId(),
                    note: 'NOTE'
                }],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const component = context.container.querySelector('div');
            expect(component).toBeTruthy();
            expect(component.className).not.toContain('text-secondary-50');
            expect(component.className).toContain('text-primary');
        });

        it('renders future dates', async () => {
            const fixtureDate = {
                date: getDate(1),
                fixtures: [],
                tournamentFixtures: [],
                notes: [{
                    id: createTemporaryId(),
                    note: 'NOTE'
                }],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const component = context.container.querySelector('div');
            expect(component).toBeTruthy();
            expect(component.className).toContain('text-secondary-50');
            expect(component.className).not.toContain('text-primary');
        });

        it('renders nothing when everything filtered out', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const component = context.container.querySelector('div');
            expect(component).toBeFalsy();
        });

        it('renders who is playing', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [{
                    id: createTemporaryId(),
                    type: 'TYPE',
                    address: 'ADDRESS',
                    sides: [{
                        id: createTemporaryId(),
                        name: 'SIDE',
                        players: [{
                            id: createTemporaryId(),
                            name: 'PLAYER',
                        }],
                    }],
                }],
                notes: [],
            };
            await renderComponent(
                {
                    date: fixtureDate,
                    filter: { },
                    renderContext: { },
                    showPlayers: { '2023-05-06T00:00:00': true },
                },
                { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id, players: [] },
                account);

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.textContent).not.toContain('SIDE');
            expect(row.textContent).toContain('PLAYER');
        });

        it('can show who is playing', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [{
                    id: createTemporaryId(),
                    type: 'TYPE',
                    address: 'ADDRESS',
                    sides: [{
                        id: createTemporaryId(),
                        name: 'SIDE',
                        players: [{
                            id: createTemporaryId(),
                            name: 'PLAYER',
                        }],
                    }],
                }],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="showPlayers_"]'));

            expect(showPlayers).toEqual({
                '2023-05-06T00:00:00': true
            });
        });

        it('can hide who is playing', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [{
                    id: createTemporaryId(),
                    type: 'TYPE',
                    address: 'ADDRESS',
                    sides: [{
                        id: createTemporaryId(),
                        name: 'SIDE',
                        players: [{
                            id: createTemporaryId(),
                            name: 'PLAYER',
                        }],
                    }],
                }],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: {
                    '2023-05-06T00:00:00': true
                },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id, players: [] }, account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="showPlayers_"]'));

            expect(showPlayers).toEqual({ });
        });
    });

    describe('when logged in', () => {
        const team = {
            id: createTemporaryId(),
            name: 'TEAM',
            address: 'ADDRESS',
        };
        const anotherTeam = {
            id: createTemporaryId(),
            name: 'ANOTHER TEAM',
            address: 'ANOTHER ADDRESS',
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const account = {
            access: {
                manageGames: true,
                manageNotes: true,
            },
        };

        it('renders without potential league fixtures when any tournaments exist', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: team.id,
                    homeTeam: team,
                    awayTeam: null,
                }],
                tournamentFixtures: [{
                    id: createTemporaryId(),
                    type: 'TYPE',
                    address: 'ADDRESS',
                    proposed: false,
                }],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.textContent).not.toContain('Bye');
            expect(row.textContent).not.toContain('TEAM');
            expect(row.textContent).toContain('TYPE at ADDRESS');
        });

        it('renders without teams that are assigned to another fixture on the same date', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: team.id,
                    homeTeam: team,
                    awayTeam: null,
                    fixturesUsingAddress: [ ],
                }, {
                    id: createTemporaryId(),
                    homeTeam: anotherTeam,
                    awayTeam: team,
                    fixturesUsingAddress: [ ],
                }],
                tournamentFixtures: [],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: { },
                renderContext: { },
                showPlayers: { },
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const homeTeams = Array.from(table.querySelectorAll('tr td:first-child')).map(td => td.textContent);
            expect(homeTeams).not.toContain('TEAM');
        });

        it('can update fixtures', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: team.id,
                    homeTeam: team,
                    awayTeam: null,
                    fixturesUsingAddress: [ ],
                }],
                tournamentFixtures: [],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: {},
                renderContext: {},
                showPlayers: {},
            }, { fixtures: [ fixtureDate ], teams: [ team, anotherTeam ], season, id: division.id }, account);
            const table = context.container.querySelector('table');
            const expected = Object.assign({}, fixtureDate);
            const expectedAwayTeam = {
                id: anotherTeam.id,
                name: anotherTeam.name,
            };
            expected.fixtures[0] = Object.assign(
                {},
                expected.fixtures[0],
                { awayTeam: expectedAwayTeam, originalAwayTeamId: 'unset' });

            await doSelectOption(table.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            expect(reportedError).toBeNull();
            expect(newFixtures).toEqual([expected]);
        });

        it('cannot change isKnockout when fixtures exist', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: createTemporaryId(),
                    homeTeam: anotherTeam,
                    awayTeam: team,
                    isKnockout: false,
                    fixturesUsingAddress: [ ],
                }],
                tournamentFixtures: [],
                notes: [],
            };

            await renderComponent({
                date: fixtureDate,
                filter: {},
                renderContext: {},
                showPlayers: {},
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);
            const toggle = context.container.querySelector('input[type="checkbox"][id^="isKnockout_"]');
            expect(toggle).toBeFalsy();
        });

        it('can change isKnockout when no fixtures exist', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: team.id,
                    homeTeam: team,
                    awayTeam: null,
                    isKnockout: false,
                    fixturesUsingAddress: [ ],
                }],
                tournamentFixtures: [],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: {},
                renderContext: {},
                showPlayers: {},
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="isKnockout_"]'));

            expect(newFixtures).toEqual([{
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: team.id,
                    homeTeam: team,
                    awayTeam: null,
                    isKnockout: true,
                    accoladesCount: true,
                }],
                tournamentFixtures: [],
                notes: [],
                isKnockout: true,
            }]);
        });

        it('can add a note', async () => {
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: team.id,
                    homeTeam: team,
                    awayTeam: null,
                    fixturesUsingAddress: [ ],
                }],
                tournamentFixtures: [],
                notes: [],
            };
            await renderComponent({
                date: fixtureDate,
                filter: {},
                renderContext: {},
                showPlayers: {},
            }, { fixtures: [ fixtureDate ], teams: [ team ], season, id: division.id }, account);

            await doClick(findButton(context.container, '📌 Add note'));

            expect(startingToAddNote).toEqual(fixtureDate.date);
        });
    });
});