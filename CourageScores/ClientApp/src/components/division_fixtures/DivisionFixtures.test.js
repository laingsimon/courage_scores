// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../tests/helpers";
import React from "react";
import {createTemporaryId} from "../../Utilities";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionDataContainer} from "../DivisionDataContainer";

describe('DivisionFixtures', () => {
    let context;
    let reportedError;
    let newFixtures;
    let divisionReloaded = false;
    let account;
    const mockSeasonApi = {

    };
    const mockGameApi = {

    };
    const mockNoteApi = {

    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionData) {
        reportedError = null;
        newFixtures = null;
        divisionReloaded = false;
        context = await renderApp(
            { seasonApi: mockSeasonApi, gameApi: mockGameApi, noteApi: mockNoteApi },
            {
                account: account,
                onError: (err) => {
                    reportedError = err;
                },
                error: null,
            },
            (<DivisionDataContainer {...divisionData}>
                <DivisionFixtures setNewFixtures={(updatedFixtures) => newFixtures = updatedFixtures} />
            </DivisionDataContainer>));
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

    function assertFixture(tr, home, homeScore, awayScore, away) {
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

    function assertTournament(tr, text, winner) {
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

    function getFixtureDateElement(index) {
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
        beforeEach(() => {
            account = null;
        });

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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022 (Qualifier)');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home2 - knockout', '3', '4', 'away2 - knockout');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home3', 'P', 'P', 'away3');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home4 - bye', '', '', 'Bye');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022Who\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022Who\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at another address');
        });
    });

    describe('when logged in', () => {
        beforeEach(() => {
            account = { access: { manageGames: true, manageNotes: true, manageScores: true } };
        });

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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022📌 Add noteQualifier');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022 (Qualifier)📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home2 - knockout', '3', '4', 'away2 - knockout');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home3', 'P', 'P', 'A team');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022📌 Add noteQualifier');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home4 - bye', '', '', 'Bye');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022📌 Add noteWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side');
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

            await renderComponent({ ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, 'Thu Oct 13 2022📌 Add noteWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at another address');
        });
    });
});