// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../tests/helpers";
import {Division} from "./Division";
import React from "react";
import {any, createTemporaryId, toMap} from "../Utilities";

describe('Division', () => {
    let context;
    let reportedError;
    const divisionDataMap = {};
    const mockDivisionApi = {
        data: async (divisionId, seasonId) => {
            const key = `${divisionId}:${seasonId}`;

            if (!any(Object.keys(divisionDataMap), k => k === key)) {
                throw new Error(`DivisionData request not expected for ${key}`);
            }

            return divisionDataMap[key];
        },
    }

    afterEach(() => {
        cleanUp(context);
    });

    function setupMockDivisionData(divisionId, seasonId, data) {
        const key = `${divisionId}:${seasonId}`;
        divisionDataMap[key] = data;
    }

    async function renderComponent(account, divisionId, mode, seasonId) {
        let route;
        let address;

        if (divisionId && mode && seasonId) {
            route = '/:divisionId/:mode/:seasonId';
            address = `/${divisionId}/${mode}/${seasonId}`;
        } else if (divisionId && mode) {
            route = '/:divisionId/:mode';
            address = `/${divisionId}/${mode}`;
        } else {
            route = '/:divisionId';
            address = `/${divisionId}`;
        }

        reportedError = null;
        const otherSeasonId = seasonId || createTemporaryId();
        const seasons = [ { id: otherSeasonId,
            name: 'A season',
            startDate: '2022-02-03T00:00:00',
            endDate: '2022-08-25T00:00:00',
            divisions: [] } ];
        context = await renderApp(
            { divisionApi: mockDivisionApi },
            {
                account: account,
                onError: (err) => {
                    reportedError = err;
                },
                error: null,
                seasons: toMap(seasons),
            },
            (<Division/>),
            route,
            address);
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

    function getOutOfSeasonDivisionData(divisionId) {
        return {
            dataErrors: [],
            fixtures: [],
            id: divisionId,
            name: 'A division',
            players: [],
            season: null,
            teams: []
        };
    }

    function assertFixture(tr, home, homeScore, awayScore, away) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toBe(5);
        expect(columns[0].textContent).toBe(home);
        expect(columns[1].textContent).toBe(homeScore);
        expect(columns[2].textContent).toBe('vs');
        expect(columns[3].textContent).toBe(awayScore);
        expect(columns[4].textContent).toBe(away);
    }

    function assertTournament(tr, text, winner) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toBe(winner ? 2 : 1);
        expect(columns[0].textContent).toBe(text);
        if (winner) {
            expect(columns[1].textContent).toBe('Winner: ' + winner);
        }
    }

    describe('when logged out', () => {
        it('renders when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            await renderComponent(null, divisionId);

            expect(reportedError).toBeNull();
            const divisionControls = context.container.querySelectorAll('div.btn-group div.btn-group');
            expect(divisionControls.length).toBe(2);
            const seasonControl = divisionControls[0];
            const divisionControl = divisionControls[1];
            expect(seasonControl).not.toBeNull();
            expect(divisionControl).not.toBeNull();
            expect(seasonControl.querySelector('button span').innerHTML).toBe('A season (3 Feb - 25 Aug)');
            expect(divisionControl.querySelector('button').innerHTML).toBe('All divisions');
        });

        it('renders teams table when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            inSeasonDivisionData.teams[0] = {
                address: 'An address',
                difference: 1,
                fixturesDrawn: 2,
                fixturesLost: 3,
                fixturesWon: 4,
                id: createTemporaryId(),
                lossRate: 5,
                matchesLost: 6,
                matchesWon: 7,
                name: 'A team',
                played: 8,
                points: 9,
                winRate: 10
            };
            await renderComponent(null, divisionId, 'teams');

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('.light-background table');
            expect(table).toBeTruthy();
            const headings = table.querySelectorAll('thead tr th');
            expect(headings.length).toBe(7);
            expect(Array.from(headings).map(h => h.innerHTML)).toEqual([ 'Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-' ]);
            const rows = table.querySelectorAll('tbody tr');
            expect(rows.length).toBe(1); // 1 team
            const teamRow = rows[0];
            expect(Array.from(teamRow.querySelectorAll('td')).map(td => td.textContent))
                .toEqual([ 'A team', '8', '9', '4', '3', '2', '1' ]);
        });

        it('renders players table when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            inSeasonDivisionData.players.push({
                captain: true,
                id: createTemporaryId(),
                name: 'A player',
                oneEighties: 1,
                over100Checkouts: 2,
                pairs: {},
                points: 3,
                rank: 4,
                singles: {
                    matchesPlayed: 6,
                    matchesWon: 7,
                    matchesLost: 0,
                    winRate: 8
                },
                team: 'A team',
                teamId: createTemporaryId(),
                triples: {},
                winPercentage: 0.5
            });
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            await renderComponent(null, divisionId, 'players');

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('.light-background table');
            expect(table).toBeTruthy();
            const headings = table.querySelectorAll('thead tr th');
            expect(headings.length).toBe(10);
            expect(Array.from(headings).map(h => h.innerHTML)).toEqual([ 'Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check' ]);
            const rows = table.querySelectorAll('tbody tr');
            expect(rows.length).toBe(1); // 1 player
            const playerRow = rows[0];
            expect(Array.from(playerRow.querySelectorAll('td')).map(td => td.textContent))
                .toEqual([ '4', '🤴 A player', 'A team', '6', '7', '0', '3', '0.5', '1', '2' ]);
        });

        it('renders notes when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            inSeasonDivisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                hasKnockoutFixtures: false,
                notes: [{
                    id: createTemporaryId(),
                    date: '2022-10-13T00:00:00',
                    note: 'Finals night!'
                } ],
                tournamentFixtures: [ ]
            });
            await renderComponent(null, divisionId, 'fixtures');

            expect(reportedError).toBeNull();
            const fixtureElements = context.container.querySelectorAll('div.light-background > div');
            expect(fixtureElements.length).toBe(2);
            const fixtureDatesContainer = fixtureElements[1];
            const fixtureDates = fixtureDatesContainer.children;
            expect(fixtureDates.length).toBe(1);
            const fixtureDateElement = fixtureDates[0];
            const noteElement = fixtureDateElement.querySelector('.alert-warning');
            expect(noteElement).toBeTruthy();
            expect(noteElement.textContent).toBe('📌Finals night!');
        });

        it('renders fixtures when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            inSeasonDivisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ {
                    id: createTemporaryId(),
                    homeScore: 1,
                    homeTeam: { id: createTemporaryId(), name: 'home1' },
                    awayScore: 2,
                    awayTeam: { id: createTemporaryId(), name: 'away1' },
                    isKnockout: false,
                    postponed: false,
                    proposal: false
                }, {
                    id: createTemporaryId(),
                    homeScore: 3,
                    homeTeam: { id: createTemporaryId(), name: 'home2 - knockout' },
                    awayScore: 4,
                    awayTeam: { id: createTemporaryId(), name: 'away2 - knockout' },
                    isKnockout: true,
                    postponed: false,
                    proposal: false
                }, {
                    id: createTemporaryId(),
                    homeScore: 0,
                    homeTeam: { id: createTemporaryId(), name: 'home3' },
                    awayScore: 0,
                    awayTeam: { id: createTemporaryId(), name: 'away3' },
                    isKnockout: false,
                    postponed: true,
                    proposal: false
                }, {
                    id: createTemporaryId(),
                    homeScore: null,
                    homeTeam: { id: createTemporaryId(), name: 'home4 - bye' },
                    awayScore: null,
                    isKnockout: false,
                    postponed: false,
                    proposal: false
                } ],
                hasKnockoutFixtures: false,
                notes: [ ],
                tournamentFixtures: []
            });
            await renderComponent(null, divisionId, 'fixtures');

            expect(reportedError).toBeNull();
            const fixtureElements = context.container.querySelectorAll('div.light-background > div');
            expect(fixtureElements.length).toBe(2);
            const fixtureDatesContainer = fixtureElements[1];
            const fixtureDates = fixtureDatesContainer.children;
            expect(fixtureDates.length).toBe(1);
            const fixtureDateElement = fixtureDates[0];
            const fixtureDateHeading = fixtureDateElement.querySelector('h4');
            expect(fixtureDateHeading.textContent).toBe('📅 Thu Oct 13 2022');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toBe(4); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1');
            assertFixture(fixturesForDate[1], 'home2 - knockout', '3', '4', 'away2 - knockout');
            assertFixture(fixturesForDate[2], 'home3', 'P', 'P', 'away3');
            assertFixture(fixturesForDate[3], 'home4 - bye', '', '', 'Bye');
        });

        it('renders tournaments when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            inSeasonDivisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                hasKnockoutFixtures: false,
                notes: [ ],
                tournamentFixtures: [ {
                    address: 'an address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    notes: 'Someone to run the venue',
                    players: [],
                    proposed: false,
                    seasonId: inSeasonDivisionData.season.id,
                    sides: [ {
                        name: 'The winning side'
                    }],
                    type: 'Pairs',
                    winningSide: {
                        name: 'The winning side'
                    }
                }, {
                    address: 'another address',
                    date: '2022-10-13T00:00:00',
                    id: createTemporaryId(),
                    notes: 'Someone to run the venue',
                    players: [],
                    proposed: false,
                    seasonId: inSeasonDivisionData.season.id,
                    sides: [ {
                        name: 'The winning side'
                    }],
                    type: 'Pairs'
                }]
            });
            await renderComponent(null, divisionId, 'fixtures');

            expect(reportedError).toBeNull();
            const fixtureElements = context.container.querySelectorAll('div.light-background > div');
            expect(fixtureElements.length).toBe(2);
            const fixtureDatesContainer = fixtureElements[1];
            const fixtureDates = fixtureDatesContainer.children;
            expect(fixtureDates.length).toBe(1); // 1 fixture
            const fixtureDateElement = fixtureDates[0];
            const fixtureDateHeading = fixtureDateElement.querySelector('h4');
            expect(fixtureDateHeading.textContent).toBe('📅 Thu Oct 13 2022Who\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toBe(2); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side');
            assertTournament(fixturesForDate[1], 'Pairs at another address');
        });

        it('does not render reports tab', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            await renderComponent(null, divisionId);

            const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
            expect(tabs.length).not.toBe(0);
            const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
            expect(tabTexts).not.toContain('Reports');
        });

        it('renders when out of season', async () => {
            const divisionId = createTemporaryId();
            const outOfSeasonDivisionData = getOutOfSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, outOfSeasonDivisionData);
            await renderComponent(null, divisionId);

            expect(reportedError).toBeNull();
            const divisionControls = context.container.querySelectorAll('div.btn-group div.btn-group');
            expect(divisionControls.length).toBe(2);
            const seasonControl = divisionControls[0];
            const divisionControl = divisionControls[1];
            expect(seasonControl).not.toBeNull();
            expect(divisionControl).not.toBeNull();
            expect(seasonControl.querySelector('button span').innerHTML).toBe('Select a season');
            expect(divisionControl.querySelector('button').innerHTML).toBe('All divisions');
        });
    });

    describe('when logged in', () => {
        it('and not permitted, does not show reports tab', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            await renderComponent({ access: { runReports: false } }, divisionId);

            const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
            expect(tabs.length).not.toBe(0);
            const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
            expect(tabTexts).not.toContain('Reports');
        });

        it('and permitted, renders reports tab', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            await renderComponent({ access: { runReports: true } }, divisionId);

            const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
            expect(tabs.length).not.toBe(0);
            const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
            expect(tabTexts).toContain('Reports');
        });

        it('renders when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
            await renderComponent({ access: {} }, divisionId);

            expect(reportedError).toBeNull();
            const divisionControls = context.container.querySelectorAll('div.btn-group div.btn-group');
            expect(divisionControls.length).toBe(2);
            const seasonControl = divisionControls[0];
            const divisionControl = divisionControls[1];
            expect(seasonControl).not.toBeNull();
            expect(divisionControl).not.toBeNull();
            expect(seasonControl.querySelector('button span').innerHTML).toBe('A season (3 Feb - 25 Aug)');
            expect(divisionControl.querySelector('button').innerHTML).toBe('All divisions');
        });

        it('renders when out of season', async () => {
            const divisionId = createTemporaryId();
            const outOfSeasonDivisionData = getOutOfSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, undefined, outOfSeasonDivisionData);
            await renderComponent({ access: {} }, divisionId);

            expect(reportedError).toBeNull();
            const divisionControls = context.container.querySelectorAll('div.btn-group div.btn-group');
            expect(divisionControls.length).toBe(2);
            const seasonControl = divisionControls[0];
            const divisionControl = divisionControls[1];
            expect(seasonControl).not.toBeNull();
            expect(divisionControl).not.toBeNull();
            expect(seasonControl.querySelector('button span').innerHTML).toBe('Select a season');
            expect(divisionControl.querySelector('button').innerHTML).toBe('All divisions');
        });
    });
});
