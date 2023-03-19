// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../tests/helpers";
import {Division} from "./Division";
import React from "react";
import {any, createTemporaryId} from "../Utilities";

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
        context = await renderApp(
            { divisionApi: mockDivisionApi },
            {
                account: account,
                onError: (err) => {
                    reportedError = err;
                },
                error: null,
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
            allTeams: [ team ],
            dataErrors: [],
            fixtures: [],
            id: divisionId,
            name: 'A division',
            players: [],
            season: season,
            seasons: [ season ],
            teams: [ team ]
        };
    }

    function getOutOfSeasonDivisionData(divisionId) {
        return {
            allTeams: [],
            dataErrors: [],
            fixtures: [],
            id: divisionId,
            name: 'A division',
            players: [],
            season: null,
            seasons: [ {
                id: createTemporaryId(),
                name: 'A season',
                startDate: '2022-02-03T00:00:00',
                endDate: '2022-08-25T00:00:00',
                divisions: []
            } ],
            teams: []
        };
    }

    it('when logged out, renders when in season', async () => {
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

    it('when logged out, renders teams table when in season', async () => {
        const divisionId = createTemporaryId();
        const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
        setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
        await renderComponent(null, divisionId, 'teams');

        expect(reportedError).toBeNull();
        const headings = context.container.querySelectorAll('div.light-background table.table thead tr th');
        expect(headings.length).toBe(7);
        expect(Array.from(headings).map(h => h.innerHTML)).toEqual([ 'Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-' ]);
    });

    it('when logged out, renders players table when in season', async () => {
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
        const headings = table.querySelectorAll('thead tr th');
        expect(headings.length).toBe(10);
        expect(Array.from(headings).map(h => h.innerHTML)).toEqual([ 'Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check' ]);
        expect(table).toBeTruthy();
        const rows = table.querySelectorAll('tbody tr');
        expect(rows.length).toBe(1); // 1 player
        const playerRow = rows[0];
        expect(Array.from(playerRow.querySelectorAll('td')).map(td => td.textContent))
            .toEqual([ '4', 'A player', 'A team', '6', '7', '0', '3', '0.5', '1', '2' ])
    });

    it('when logged out, renders fixtures when in season', async () => {
        const divisionId = createTemporaryId();
        const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
        setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
        await renderComponent(null, divisionId, 'fixtures');

        expect(reportedError).toBeNull();
        // TODO: Assert something
    });

    it('when logged out, does not render reports tab', async () => {
        const divisionId = createTemporaryId();
        const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
        setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
        await renderComponent(null, divisionId);

        const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
        expect(tabs.length).not.toBe(0);
        const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
        expect(tabTexts).not.toContain('Reports');
    });

    it('when logged in and not permitted, does not show reports tab', async () => {
        const divisionId = createTemporaryId();
        const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
        setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
        await renderComponent({ access: { runReports: false } }, divisionId);

        const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
        expect(tabs.length).not.toBe(0);
        const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
        expect(tabTexts).not.toContain('Reports');
    });

    it('when logged in and permitted, renders reports tab', async () => {
        const divisionId = createTemporaryId();
        const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
        setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
        await renderComponent({ access: { runReports: true } }, divisionId);

        const tabs = context.container.querySelectorAll('.nav-tabs li.nav-item');
        expect(tabs.length).not.toBe(0);
        const tabTexts = Array.from(tabs).map(t => t.querySelector('a').innerHTML);
        expect(tabTexts).toContain('Reports');
    });

    it('when logged out, renders when out of season', async () => {
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

    it('when logged in, renders when in season', async () => {
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

    it('when logged in, renders when out of season', async () => {
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