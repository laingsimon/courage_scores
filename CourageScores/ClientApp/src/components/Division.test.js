// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton} from "../helpers/tests";
import {Division} from "./Division";
import React from "react";
import {any, toMap} from "../helpers/collections";
import {createTemporaryId} from "../helpers/projection";

describe('Division', () => {
    let context;
    let reportedError;
    const divisionDataMap = { };
    const divisionApi = {
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
            { divisionApi },
            { name: 'Courage Scores' },
            {
                account: account,
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
        expect(columns.length).toEqual(5);
        expect(columns[0].textContent).toEqual(home);
        expect(columns[1].textContent).toEqual(homeScore);
        expect(columns[2].textContent).toEqual('vs');
        expect(columns[3].textContent).toEqual(awayScore);
        expect(columns[4].textContent).toEqual(away);
    }

    function assertTournament(tr, text, winner) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toEqual(winner ? 2 : 1);
        expect(columns[0].textContent).toEqual(text);
        if (winner) {
            expect(columns[1].textContent).toEqual('Winner: ' + winner);
        }
    }

    describe('when logged out', () => {
        it('renders when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent(null, divisionId);

            expect(reportedError).toBeNull();
            const divisionControls = context.container.querySelectorAll('div.btn-group div.btn-group');
            expect(divisionControls.length).toEqual(2);
            const seasonControl = divisionControls[0];
            const divisionControl = divisionControls[1];
            expect(seasonControl).not.toBeNull();
            expect(divisionControl).not.toBeNull();
            expect(seasonControl.querySelector('button span').innerHTML).toEqual('A season (3 Feb - 25 Aug)');
            expect(divisionControl.querySelector('button').innerHTML).toEqual('All divisions');
        });

        it('renders teams table when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);
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
            const table = context.container.querySelector('.content-background table');
            expect(table).toBeTruthy();
            const headings = table.querySelectorAll('thead tr th');
            expect(headings.length).toEqual(7);
            expect(Array.from(headings).map(h => h.innerHTML)).toEqual([ 'Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-' ]);
            const rows = table.querySelectorAll('tbody tr');
            expect(rows.length).toEqual(1); // 1 team
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
                pairs: { },
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
                triples: { },
                winPercentage: 0.5
            });
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent(null, divisionId, 'players');

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('.content-background table');
            expect(table).toBeTruthy();
            const headings = table.querySelectorAll('thead tr th');
            expect(headings.length).toEqual(10);
            expect(Array.from(headings).map(h => h.innerHTML)).toEqual([ 'Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check' ]);
            const rows = table.querySelectorAll('tbody tr');
            expect(rows.length).toEqual(1); // 1 player
            const playerRow = rows[0];
            expect(Array.from(playerRow.querySelectorAll('td')).map(td => td.textContent))
                .toEqual([ '4', '🤴 A player', 'A team', '6', '7', '0', '3', '0.5', '1', '2' ]);
        });

        it('navigates to player by their team and player name', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            const playerName = 'A player';
            const teamName = 'A team';
            inSeasonDivisionData.players.push({
                captain: true,
                id: createTemporaryId(),
                name: playerName,
                oneEighties: 1,
                over100Checkouts: 2,
                pairs: { },
                points: 3,
                rank: 4,
                singles: {
                    matchesPlayed: 6,
                    matchesWon: 7,
                    matchesLost: 0,
                    winRate: 8
                },
                team: teamName,
                teamId: createTemporaryId(),
                triples: { },
                winPercentage: 0.5
            });
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent(null, divisionId, 'players');

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('.content-background table');
            expect(table).toBeTruthy();
            const playerRow = table.querySelector('tbody tr:first-child');
            const playerLink = playerRow.querySelector('td:nth-child(2) a');
            expect(playerLink.textContent).toContain('A player');
            expect(playerLink.href).toEqual(`http://localhost/division/${encodeURI(inSeasonDivisionData.name)}/player:${encodeURI(playerName)}@${encodeURI(teamName)}/${encodeURI(inSeasonDivisionData.season.name)}`);
        });

        it('navigates to player team by their team name', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            const playerId = createTemporaryId();
            const teamName = 'A team';
            inSeasonDivisionData.players.push({
                captain: true,
                id: playerId,
                name: 'A player',
                oneEighties: 1,
                over100Checkouts: 2,
                pairs: { },
                points: 3,
                rank: 4,
                singles: {
                    matchesPlayed: 6,
                    matchesWon: 7,
                    matchesLost: 0,
                    winRate: 8
                },
                team: teamName,
                teamId: createTemporaryId(),
                triples: { },
                winPercentage: 0.5
            });
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent(null, divisionId, 'players');

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('.content-background table');
            expect(table).toBeTruthy();
            const playerRow = table.querySelector('tbody tr:first-child');
            const playerLink = playerRow.querySelector('td:nth-child(3) a');
            expect(playerLink.textContent).toContain('A team');
            expect(playerLink.href).toEqual(`http://localhost/division/${encodeURI(inSeasonDivisionData.name)}/team:${encodeURI(teamName)}/${encodeURI(inSeasonDivisionData.season.name)}`);
        });

        it('navigates to team by their team name', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);
            const teamName = 'A team';
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
                name: teamName,
                played: 8,
                points: 9,
                winRate: 10
            };
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent(null, divisionId, 'teams');

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('.content-background table');
            expect(table).toBeTruthy();
            const playerRow = table.querySelector('tbody tr:first-child');
            const playerLink = playerRow.querySelector('a:nth-child(1)');
            expect(playerLink.textContent).toContain('A team');
            expect(playerLink.href).toEqual(`http://localhost/division/${encodeURI(inSeasonDivisionData.name)}/team:${encodeURI(teamName)}/${encodeURI(inSeasonDivisionData.season.name)}`);
        });

        it('renders notes when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);
            inSeasonDivisionData.fixtures.push({
                date: '2022-10-13T00:00:00',
                fixtures: [ ],
                notes: [{
                    id: createTemporaryId(),
                    date: '2022-10-13T00:00:00',
                    note: 'Finals night!'
                } ],
                tournamentFixtures: [ ]
            });

            await renderComponent(null, divisionId, 'fixtures');

            expect(reportedError).toBeNull();
            const fixtureElements = context.container.querySelectorAll('div.content-background > div');
            expect(fixtureElements.length).toEqual(2);
            const fixtureDatesContainer = fixtureElements[1];
            const fixtureDates = fixtureDatesContainer.children;
            expect(fixtureDates.length).toEqual(1);
            const fixtureDateElement = fixtureDates[0];
            const noteElement = fixtureDateElement.querySelector('.alert-warning');
            expect(noteElement).toBeTruthy();
            expect(noteElement.textContent).toEqual('📌Finals night!');
        });

        it('renders fixtures when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);
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
                }, {
                    id: createTemporaryId(),
                    homeScore: 3,
                    homeTeam: { id: createTemporaryId(), name: 'home2 - knockout' },
                    awayScore: 4,
                    awayTeam: { id: createTemporaryId(), name: 'away2 - knockout' },
                    isKnockout: true,
                    postponed: false,
                }, {
                    id: createTemporaryId(),
                    homeScore: 0,
                    homeTeam: { id: createTemporaryId(), name: 'home3' },
                    awayScore: 0,
                    awayTeam: { id: createTemporaryId(), name: 'away3' },
                    isKnockout: false,
                    postponed: true,
                }, {
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

            await renderComponent(null, divisionId, 'fixtures');

            expect(reportedError).toBeNull();
            const fixtureElements = context.container.querySelectorAll('div.content-background > div');
            expect(fixtureElements.length).toEqual(2);
            const fixtureDatesContainer = fixtureElements[1];
            const fixtureDates = fixtureDatesContainer.children;
            expect(fixtureDates.length).toEqual(1);
            const fixtureDateElement = fixtureDates[0];
            const fixtureDateHeading = fixtureDateElement.querySelector('h4');
            expect(fixtureDateHeading.textContent).toEqual('📅 13 Oct (Qualifier)');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(4); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1');
            assertFixture(fixturesForDate[1], 'home2 - knockout', '3', '4', 'away2 - knockout');
            assertFixture(fixturesForDate[2], 'home3', 'P', 'P', 'away3');
            assertFixture(fixturesForDate[3], 'home4 - bye', '', '', 'Bye');
        });

        it('renders tournaments when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);
            inSeasonDivisionData.fixtures.push({
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
            const fixtureElements = context.container.querySelectorAll('div.content-background > div');
            expect(fixtureElements.length).toEqual(2);
            const fixtureDatesContainer = fixtureElements[1];
            const fixtureDates = fixtureDatesContainer.children;
            expect(fixtureDates.length).toEqual(1); // 1 fixture
            const fixtureDateElement = fixtureDates[0];
            const fixtureDateHeading = fixtureDateElement.querySelector('h4');
            expect(fixtureDateHeading.textContent).toEqual('📅 13 OctWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(2); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side');
            assertTournament(fixturesForDate[1], 'Pairs at another address');
        });

        it('does not render reports tab', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent(null, divisionId);

            const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
            expect(tabs.length).not.toEqual(0);
            const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
            expect(tabTexts).not.toContain('Reports');
        });

        it('renders when out of season', async () => {
            const divisionId = createTemporaryId();
            const outOfSeasonDivisionData = getOutOfSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, outOfSeasonDivisionData);

            await renderComponent(null, divisionId);

            expect(reportedError).toBeNull();
            const divisionControls = context.container.querySelectorAll('div.btn-group div.btn-group');
            expect(divisionControls.length).toEqual(2);
            const seasonControl = divisionControls[0];
            const divisionControl = divisionControls[1];
            expect(seasonControl).not.toBeNull();
            expect(divisionControl).not.toBeNull();
            expect(seasonControl.querySelector('button span').innerHTML).toEqual('Select a season');
            expect(divisionControl.querySelector('button').innerHTML).toEqual('All divisions');
        });

        it('renders error from api', async () => {
            const divisionId = createTemporaryId();
            const errorDivisionData = {
                status: '400',
                errors: {
                    'key': 'some error',
                }
            };
            setupMockDivisionData(divisionId, null, errorDivisionData);

            console.log = () => { };
            await renderComponent(null, divisionId);

            expect(reportedError).toEqual('Error accessing division: Code: 400 -- key: some error');
        });

        it('does not render data errors from api', async () => {
            const divisionId = createTemporaryId();
            const errorDivisionData = {
                id: divisionId,
                dataErrors: ['some data error', 'another data error']
            };
            setupMockDivisionData(divisionId, null, errorDivisionData);

            console.log = () => { };
            await renderComponent(null, divisionId);

            expect(context.container.textContent).not.toContain('some data error');
            expect(context.container.textContent).not.toContain('another data error');
        });
    });

    describe('when logged in', () => {
        it('and not permitted, does not show reports tab', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent({ access: { runReports: false } }, divisionId);

            const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
            expect(tabs.length).not.toEqual(0);
            const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
            expect(tabTexts).not.toContain('Reports');
        });

        it('and permitted, renders reports tab', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent({ access: { runReports: true } }, divisionId);

            const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
            expect(tabs.length).not.toEqual(0);
            const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
            expect(tabTexts).toContain('Reports');
        });

        it('renders when in season', async () => {
            const divisionId = createTemporaryId();
            const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, inSeasonDivisionData);

            await renderComponent({ access: { } }, divisionId);

            expect(reportedError).toBeNull();
            const divisionControls = context.container.querySelectorAll('div.btn-group div.btn-group');
            expect(divisionControls.length).toEqual(2);
            const seasonControl = divisionControls[0];
            const divisionControl = divisionControls[1];
            expect(seasonControl).not.toBeNull();
            expect(divisionControl).not.toBeNull();
            expect(seasonControl.querySelector('button span').innerHTML).toEqual('A season (3 Feb - 25 Aug)');
            expect(divisionControl.querySelector('button').innerHTML).toEqual('All divisions');
        });

        it('renders when out of season', async () => {
            const divisionId = createTemporaryId();
            const outOfSeasonDivisionData = getOutOfSeasonDivisionData(divisionId);
            setupMockDivisionData(divisionId, null, outOfSeasonDivisionData);

            await renderComponent({ access: { } }, divisionId);

            expect(reportedError).toBeNull();
            const divisionControls = context.container.querySelectorAll('div.btn-group div.btn-group');
            expect(divisionControls.length).toEqual(2);
            const seasonControl = divisionControls[0];
            const divisionControl = divisionControls[1];
            expect(seasonControl).not.toBeNull();
            expect(divisionControl).not.toBeNull();
            expect(seasonControl.querySelector('button span').innerHTML).toEqual('Select a season');
            expect(divisionControl.querySelector('button').innerHTML).toEqual('All divisions');
        });

        it('renders data errors from api', async () => {
            const divisionId = createTemporaryId();
            const errorDivisionData = {
                id: divisionId,
                dataErrors: ['some data error', 'another data error']
            };
            setupMockDivisionData(divisionId, null, errorDivisionData);

            console.log = () => { };
            await renderComponent({ access: { } }, divisionId);

            expect(context.container.textContent).toContain('some data error');
            expect(context.container.textContent).toContain('another data error');
        });

        it('can hide data errors from api', async () => {
            const divisionId = createTemporaryId();
            const errorDivisionData = {
                id: divisionId,
                dataErrors: ['some data error', 'another data error']
            };
            setupMockDivisionData(divisionId, null, errorDivisionData);
            console.log = () => { };
            await renderComponent({ access: { } }, divisionId);

            await doClick(findButton(context.container, 'Hide errors'));

            expect(context.container.textContent).not.toContain('some data error');
            expect(context.container.textContent).not.toContain('another data error');
        });
    });
});
