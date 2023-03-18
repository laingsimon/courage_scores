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
        setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
        await renderComponent(null, divisionId, 'players');

        expect(reportedError).toBeNull();
        const headings = context.container.querySelectorAll('div.light-background table.table thead tr th');
        expect(headings.length).toBe(10);
        expect(Array.from(headings).map(h => h.innerHTML)).toEqual([ 'Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check' ]);
    });

    it('when logged out, renders fixtures when in season', async () => {
        const divisionId = createTemporaryId();
        const inSeasonDivisionData = getInSeasonDivisionData(divisionId);
        setupMockDivisionData(divisionId, undefined, inSeasonDivisionData);
        await renderComponent(null, divisionId, 'fixtures');

        expect(reportedError).toBeNull();
        // TODO: Assert something
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