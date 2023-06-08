// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, findButton, doClick, doChange, doSelectOption} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionDataContainer} from "../DivisionDataContainer";

describe('DivisionFixtures', () => {
    let context;
    let reportedError;
    let newFixtures;
    let divisionReloaded = false;
    let updatedNote;
    let createdNote;
    const seasonApi = {

    };
    const gameApi = {

    };
    const noteApi = {
        create: async (note) => {
            createdNote = note;
            return { success: true };
        },
        upsert: async (id, note, lastUpdated) => {
            updatedNote = { id, note, lastUpdated };
            return { success: true };
        },
    };
    const tournamentApi = {
        update: async () => {
            return { success: true };
        },
        create: async () => {
            return { success: true };
        }
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionData, account, route, path) {
        reportedError = null;
        newFixtures = null;
        divisionReloaded = false;
        updatedNote = null;
        createdNote = null;
        context = await renderApp(
            { seasonApi, gameApi, noteApi, tournamentApi },
            {
                account,
                onError: (err) => {
                    reportedError = err;
                },
                seasons: [],
                divisions: []
            },
            (<DivisionDataContainer onReloadDivision={onReloadDivision} {...divisionData}>
                <DivisionFixtures setNewFixtures={(updatedFixtures) => newFixtures = updatedFixtures} />
            </DivisionDataContainer>),
            route,
            path);
    }

    function getInSeasonDivisionData(divisionId) {
        const season = {
            id: createTemporaryId(),
            name: 'A season',
            startDate: '2022-02-03T00:00:00',
            endDate: '2022-08-25T00:00:00',
            divisions: []
        };
        const team = { id: createTemporaryId(), name: 'A team' };
        return {
            dataErrors: [],
            fixtures: [],
            id: divisionId,
            name: 'A division',
            players: [],
            season: season,
            teams: [ team ]
        };
    }

    function assertFixture(tr, home, homeScore, awayScore, away, account) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toEqual(5 + (account ? 1 : 0));
        expect(columns[0].textContent).toEqual(home);
        expect(columns[1].textContent).toEqual(homeScore);
        expect(columns[2].textContent).toEqual('vs');
        expect(columns[3].textContent).toEqual(awayScore);

        const selectedAwayTeam = columns[4].querySelector('div.btn-group > button');
        if (account && selectedAwayTeam) {
            expect(selectedAwayTeam.textContent).toEqual(away);
        } else {
            expect(columns[4].textContent).toEqual(away);
        }
    }

    function assertTournament(tr, text, winner, account) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toEqual((winner ? 2 : 1) + (account ? 1 : 0));
        expect(columns[0].textContent).toEqual(text);
        if (winner) {
            expect(columns[1].textContent).toEqual('Winner: ' + winner);
        }
    }

    async function onReloadDivision() {
        divisionReloaded = true;
    }

    function getFixtureDateElement(index, account) {
        const fixtureElements = context.container.querySelectorAll('div.light-background > div');
        expect(fixtureElements.length).toEqual(2 + (account ? 1 : 0));
        const fixtureDatesContainer = fixtureElements[1];
        const fixtureDates = fixtureDatesContainer.children;
        expect(fixtureElements.length).toBeGreaterThan(index);
        return fixtureDates[index];
    }

    function assertFixtureDate(fixtureDateElement, expectedDate) {
        const fixtureDateHeading = fixtureDateElement.querySelector('h4');
        expect(fixtureDateHeading.textContent).toEqual('📅 ' + expectedDate);
    }

    describe('when logged out', () => {
        const account = null;

        it('renders notes', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [{
                    id: createTemporaryId(),
                    date: '2022-10-13T00:00:00',
                    note: 'Finals night!'
                } ],
                tournamentFixtures: [ ]
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const noteElement = fixtureDateElement.querySelector('.alert-warning');
            expect(noteElement).toBeTruthy();
            expect(noteElement.textContent).toEqual('📌Finals night!');
        });

        it('renders played league fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: createTemporaryId(),
                    homeScore: 1,
                    homeTeam: { id: createTemporaryId(), name: 'home1' },
                    awayScore: 2,
                    awayTeam: { id: createTemporaryId(), name: 'away1' },
                    isKnockout: false,
                    postponed: false,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1', account);
        });

        it('renders played knockout fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: createTemporaryId(),
                    homeScore: 3,
                    homeTeam: { id: createTemporaryId(), name: 'home2 - knockout' },
                    awayScore: 4,
                    awayTeam: { id: createTemporaryId(), name: 'away2 - knockout' },
                    isKnockout: true,
                    postponed: false,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct (Qualifier)');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home2 - knockout', '3', '4', 'away2 - knockout', account);
        });

        it('renders postponed fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: createTemporaryId(),
                    homeScore: 0,
                    homeTeam: { id: createTemporaryId(), name: 'home3' },
                    awayScore: 0,
                    awayTeam: { id: createTemporaryId(), name: 'away3' },
                    isKnockout: false,
                    postponed: true,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home3', 'P', 'P', 'away3', account);
        });

        it('renders byes', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: createTemporaryId(),
                    homeScore: null,
                    homeTeam: { id: createTemporaryId(), name: 'home4 - bye' },
                    awayScore: null,
                    isKnockout: false,
                    postponed: false,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home4 - bye', '', '', 'Bye', account);
        });

        it('renders played tournaments', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ ],
                tournamentFixtures: [ {
                    address: 'an address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    notes: 'Someone to run the venue',
                    players: [],
                    proposed: false,
                    seasonId: divisionData.season.id,
                    sides: [ {
                        name: 'The winning side'
                    }],
                    type: 'Pairs',
                    winningSide: {
                        name: 'The winning side'
                    }
                } ]
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 OctWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side', account);
        });

        it('renders unplayed tournaments', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ ],
                tournamentFixtures: [ {
                    address: 'another address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    notes: 'Someone to run the venue',
                    players: [],
                    proposed: false,
                    seasonId: divisionData.season.id,
                    sides: [ {
                        name: 'The winning side'
                    }],
                    type: 'Pairs'
                }]
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 OctWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at another address', account);
        });

        it('renders tournament players', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ ],
                tournamentFixtures: [ {
                    address: 'another address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    notes: 'Someone to run the venue',
                    players: [],
                    proposed: false,
                    seasonId: divisionData.season.id,
                    sides: [ {
                        id: createTemporaryId(),
                        name: 'The winning side',
                        players: [{
                            id: createTemporaryId(),
                            name: 'SIDE PLAYER',
                        }]
                    }],
                    type: 'Pairs'
                }]
            });

            await renderComponent(divisionData, account, '/division', '/division#show-who-is-playing');

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            expect(fixtureDateElement.textContent).toContain('SIDE PLAYER');
        });

        it('can change filters', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ ],
                tournamentFixtures: [ {
                    address: 'another address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    notes: 'Someone to run the venue',
                    players: [],
                    proposed: false,
                    seasonId: divisionData.season.id,
                    sides: [ {
                        name: 'The winning side'
                    }],
                    type: 'Pairs'
                }]
            });
            await renderComponent(divisionData, account);
            const filterContainer = context.container.querySelector('.light-background > div:first-child');

            await doSelectOption(filterContainer.querySelector('.dropdown-menu'), 'League fixtures');

            expect(reportedError).toBeNull();
        });
    });

    describe('when logged in', () => {
        const account = {
            access: {
                manageGames: true,
                manageNotes: true,
                manageScores: true
            },
        };

        it('renders notes', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [{
                    id: createTemporaryId(),
                    date: '2022-10-13T00:00:00',
                    note: 'Finals night!'
                } ],
                tournamentFixtures: [ ]
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteQualifier');
            const noteElement = fixtureDateElement.querySelector('.alert-warning');
            expect(noteElement).toBeTruthy();
            expect(noteElement.textContent).toEqual('📌Finals night!Edit');
        });

        it('renders played league fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: createTemporaryId(),
                    homeScore: 1,
                    homeTeam: { id: createTemporaryId(), name: 'home1', address: 'home1' },
                    awayScore: 2,
                    awayTeam: { id: createTemporaryId(), name: 'away1', address: 'away1' },
                    isKnockout: false,
                    postponed: false,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1', account);
        });

        it('renders played knockout fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: createTemporaryId(),
                    homeScore: 3,
                    homeTeam: { id: createTemporaryId(), name: 'home2 - knockout', address: 'home2' },
                    awayScore: 4,
                    awayTeam: { id: createTemporaryId(), name: 'away2 - knockout', address: 'away2' },
                    isKnockout: true,
                    postponed: false,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct (Qualifier)📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home2 - knockout', '3', '4', 'away2 - knockout', account);
        });

        it('renders postponed fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: createTemporaryId(),
                    homeScore: 0,
                    homeTeam: { id: createTemporaryId(), name: 'home3', address: 'home3' },
                    awayScore: 0,
                    awayTeam: { id: divisionData.teams[0].id, name: 'away3', address: 'away3' },
                    isKnockout: false,
                    postponed: true,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home3', 'P', 'P', 'A team', account);
        });

        it('renders byes', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            const teamId = createTemporaryId();
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: teamId,
                    homeScore: null,
                    homeTeam: { id: teamId, name: 'home4 - bye', address: 'home4' },
                    awayScore: null,
                    isKnockout: false,
                    postponed: false,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteQualifier');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home4 - bye', '', '', 'Bye', account);
        });

        it('renders played tournaments', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ ],
                tournamentFixtures: [ {
                    address: 'an address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    notes: 'Someone to run the venue',
                    players: [],
                    proposed: false,
                    seasonId: divisionData.season.id,
                    sides: [ {
                        name: 'The winning side'
                    }],
                    type: 'Pairs',
                    winningSide: {
                        name: 'The winning side'
                    }
                } ]
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side', account);
        });

        it('renders unplayed tournaments', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ ],
                tournamentFixtures: [ {
                    address: 'another address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    notes: 'Someone to run the venue',
                    players: [],
                    proposed: false,
                    seasonId: divisionData.season.id,
                    sides: [ {
                        name: 'The winning side'
                    }],
                    type: 'Pairs'
                }]
            });

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at another address', null, account);
        });

        it('reloads tournaments if they are changed', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ { id: createTemporaryId(), note: 'A note' } ],
                tournamentFixtures: [ {
                    address: 'another address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    players: [],
                    proposed: true,
                    seasonId: divisionData.season.id,
                    sides: [ ]
                } ]
            });
            await renderComponent(
                {
                    ...divisionData,
                    onReloadDivision: () => {
                        divisionReloaded = true;
                        return divisionData;
                    }
                },
                account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(fixtureDateElement, '➕'));

            expect(reportedError).toBeNull();
            expect(divisionReloaded).toEqual(true);
            expect(newFixtures).not.toBeNull();
        });

        it('can add a note', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            const teamId = createTemporaryId();
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: teamId,
                    homeScore: null,
                    homeTeam: { id: teamId, name: 'home5 - bye', address: 'home5' },
                    awayScore: null,
                    isKnockout: false,
                    postponed: false,
                } ],
                notes: [ ],
                tournamentFixtures: []
            });
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);

            await doClick(findButton(fixtureDateElement, '📌 Add note'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Create note');
        });

        it('can edit a note', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ {
                    id: createTemporaryId(),
                    date: '2022-10-13T00:00:00',
                    note: 'A note'
                } ],
                tournamentFixtures: []
            });
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);

            await doClick(findButton(fixtureDateElement.querySelector('.alert'), 'Edit'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Edit note');
        });

        it('can save changes to notes', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ {
                    id: createTemporaryId(),
                    date: '2022-10-13T00:00:00',
                    note: 'A note'
                } ],
                tournamentFixtures: []
            });
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(fixtureDateElement.querySelector('.alert'), 'Edit'));

            const dialog = context.container.querySelector('.modal-dialog');
            doChange(dialog, 'textarea[name="note"]', 'New note');
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
            expect(divisionReloaded).toEqual(true);
            expect(updatedNote).not.toBeNull();
        });

        it('can open add date dialog', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            await renderComponent(divisionData, account);

            await doClick(findButton(context.container, '➕ Add date'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Add date');
        });

        it('can close add date dialog', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            await renderComponent(divisionData, account);

            await doClick(findButton(context.container, '➕ Add date'));
            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });

        it('prevents adding a date when no date selected', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            await renderComponent(divisionData, account);
            await doClick(findButton(context.container, '➕ Add date'));
            const dialog = context.container.querySelector('.modal-dialog');
            let alert;
            window.alert = (message) => alert = message;

            await doClick(findButton(dialog, 'Add date'));

            expect(reportedError).toBeNull();
            expect(newFixtures).toBeNull();
            expect(alert).toEqual('Select a date first');
        });

        it('does not add date if already exists', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            divisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [ { id: createTemporaryId(), note: 'A note' } ],
                tournamentFixtures: [ {
                    address: 'another address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    players: [],
                    proposed: true,
                    seasonId: divisionData.season.id,
                    sides: [ ]
                } ]
            });
            await renderComponent(divisionData, account);
            await doClick(findButton(context.container, '➕ Add date'));
            const dialog = context.container.querySelector('.modal-dialog');

            doChange(dialog, 'input[type="date"]', '2022-10-13');
            await doClick(findButton(dialog, 'Add date'));

            expect(reportedError).toBeNull();
            expect(newFixtures).toBeNull();
        });

        it('can add a date', async () => {
            const divisionId = createTemporaryId();
            const divisionData = getInSeasonDivisionData(divisionId);
            await renderComponent(divisionData, account);
            await doClick(findButton(context.container, '➕ Add date'));
            const dialog = context.container.querySelector('.modal-dialog');

            doChange(dialog, 'input[type="date"]', '2023-05-06');
            await doClick(dialog, 'input[name="isKnockout"]');
            await doClick(findButton(dialog, 'Add date'));

            expect(reportedError).toBeNull();
            expect(newFixtures).not.toBeNull();
            expect(newFixtures[0].date).toEqual('2023-05-06T00:00:00');
            expect(newFixtures[0].isNew).toEqual(true);
            expect(newFixtures[0].isKnockout).toEqual(true);
        });
    });
});