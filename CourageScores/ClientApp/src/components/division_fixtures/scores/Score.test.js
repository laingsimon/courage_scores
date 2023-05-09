// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../tests/helpers";
import React from "react";
import {toMap, any, createTemporaryId} from "../../../Utilities";
import {Score} from "./Score";

describe('Score', () => {
    let context;
    let reportedError;
    let account;
    let fixtureDataMap = {};
    let updatedFixtures;
    const mockGameApi = {
        get: async (fixtureId) => {
            if (any(Object.keys(fixtureDataMap), key => key === fixtureId)) {
                return fixtureDataMap[fixtureId];
            }

            throw new Error('Unexpected request for fixture data');
        },
        updateScores: async (fixtureId, fixtureData) => {
            updatedFixtures[fixtureId] = fixtureData;
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(id, appData) {
        reportedError = null;
        updatedFixtures = {};
        context = await renderApp(
            { gameApi: mockGameApi },
            {
                account: account,
                onError: (err) => {
                    reportedError = err;
                },
                error: null,
                ...appData
            },
            (<Score />),
            '/:fixtureId',
            '/' + id);
    }

    function getDefaultAppData() {
        const division = {
            id: createTemporaryId(),
            name: 'A division'
        };
        const season = {
            id: createTemporaryId(),
            name: 'A season',
            startDate: '2022-02-03T00:00:00',
            endDate: '2022-08-25T00:00:00',
            divisions: [ division ]
        };
        const homePlayer = {
            id: createTemporaryId(),
            name: 'Home player'
        };
        const awayPlayer = {
            id: createTemporaryId(),
            name: 'Away player'
        };
        const homeTeam = {
            id: createTemporaryId(),
            name: 'Home team',
            seasons: [ {
                seasonId: season.id,
                players: [ homePlayer ]
            } ]
        };
        const awayTeam = {
            id: createTemporaryId(),
            name: 'Away team',
            seasons: [ {
                seasonId: season.id,
                players: [ awayPlayer ]
            } ]
        };

        return {
            divisions: toMap([ division ]),
            seasons: toMap([ season ]),
            teams: toMap([ homeTeam, awayTeam ])
        };
    }

    function getUnplayedFixtureData(fixtureId, appData) {
        const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
        const awayTeam = appData.teams.filter(t => t.name === 'Away team')[0];

        return {
            home: {
                id: homeTeam.id,
                name: homeTeam.name
            },
            away: {
                id: awayTeam.id,
                name: awayTeam.name
            },
            seasonId: appData.seasons.filter(_ => true)[0].id,
            divisionId: appData.divisions.filter(_ => true)[0].id,
            matches: [],
            matchOptions: [],
            date: '2023-01-02T00:00:00'
        };
    }

    function getPlayedFixtureData(fixtureId, appData) {
        const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
        const awayTeam = appData.teams.filter(t => t.name === 'Away team')[0];

        function createMatch(homeScore, awayScore) {
            return {
                homePlayers: [ {
                    id: createTemporaryId(),
                    name: 'Home player'
                }],
                awayPlayers: [ {
                    id: createTemporaryId(),
                    name: 'Away player'
                }],
                homeScore: homeScore,
                awayScore: awayScore,
                id: createTemporaryId()
            };
        }

        const firstDivision = appData.divisions.filter(_ => true)[0];
        const firstSeason = appData.seasons.filter(_ => true)[0];

        return {
            home: {
                id: homeTeam ? homeTeam.id : createTemporaryId(),
                name: homeTeam ? homeTeam.name : 'not found',
                manOfTheMatch: createTemporaryId()
            },
            away: {
                id: awayTeam ? awayTeam.id : createTemporaryId(),
                name: awayTeam ? awayTeam.name : 'not found',
                manOfTheMatch: createTemporaryId()
            },
            seasonId: firstSeason ? firstSeason.id : createTemporaryId(),
            divisionId: firstDivision ? firstDivision.id : createTemporaryId(),
            matches: [
                createMatch(3,2),
                createMatch(3,2),
                createMatch(3,2),
                createMatch(3,2),
                createMatch(3,2),
                createMatch(3,0),
                createMatch(3,0),
                createMatch(3,0)
            ],
            matchOptions: [],
            date: '2023-01-02T00:00:00',
            oneEighties: [ {
                id: createTemporaryId(),
                name: 'Home player'
            } ],
            over100Checkouts: [ {
                id: createTemporaryId(),
                name: 'Away player',
                notes: '140'
            } ]
        };
    }

    function assertMatchRow(tr, ...expectedCellText) {
        const cellText = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());

        expect(cellText.length).toEqual(expectedCellText.length);

        for (let index = 0; index < cellText.length; index++) {
            const cellTextValue = cellText[index];
            const expectedCellTextValue = expectedCellText[index];

            expect(cellTextValue).toContain(expectedCellTextValue);
        }
    }

    describe('when logged out', () => {
        beforeEach(() => {
            account = null;
        });

        it('renders score card with no results', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            fixtureDataMap[fixtureId] = getUnplayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.light-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const singleRow = tableBody.querySelector('tr td');
            expect(singleRow).toBeTruthy();
            expect(singleRow.textContent).toEqual('No scores, yet');
        });

        it('renders score card with results', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            fixtureDataMap[fixtureId] = getPlayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.light-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(12);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[2], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[3], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[4], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[5], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[6], 'Doubles');
            assertMatchRow(matchRows[7], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[8], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[11], '180sHome player', '', '100+ c/oAway player (140)');
        });

        it('renders when no divisions', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            appData.divisions = [];
            fixtureDataMap[fixtureId] = getPlayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toEqual('App has finished loading, no divisions are available');
        });

        it('renders when no seasons', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            appData.seasons = [];
            fixtureDataMap[fixtureId] = getPlayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toEqual('App has finished loading, no seasons are available');
        });

        it('renders when no teams', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            appData.teams = [];
            fixtureDataMap[fixtureId] = getPlayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toEqual('App has finished loading, no teams are available');
        });
    });

    describe('when logged in', () => {
        beforeEach(() => {
            account = { access: { manageScores: true } };
        });

        it('renders score card without results', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            fixtureDataMap[fixtureId] = getUnplayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.light-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Doubles');
            assertMatchRow(matchRows[7], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[8], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home playerAdd a player...  Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], 'Select some player/s to add 180s and hi-checks');
        });

        it('renders score card with results', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            fixtureDataMap[fixtureId] = getPlayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.light-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Doubles');
            assertMatchRow(matchRows[7], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[8], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home playerAdd a player...  Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], '180s', '', '100+ c/o');
        });

        it('renders when no divisions', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            appData.divisions = [];
            fixtureDataMap[fixtureId] = getPlayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toEqual('App has finished loading, no divisions are available');
        });

        it('renders when no seasons', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            appData.seasons = [];
            fixtureDataMap[fixtureId] = getPlayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toEqual('App has finished loading, no seasons are available');
        });

        it('renders when no teams', async () => {
            const fixtureId = createTemporaryId();
            const appData = getDefaultAppData();
            appData.teams = [];
            fixtureDataMap[fixtureId] = getPlayedFixtureData(fixtureId, appData);

            await renderComponent(fixtureId, appData);

            expect(reportedError).toEqual('App has finished loading, no teams are available');
        });
    });
});