// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../../../tests/helpers";
import React from "react";
import {LegStatistics} from "./LegStatistics";

describe('LegStatistics', () => {
    let context;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        context = await renderApp(
            { },
            { },
            <LegStatistics {...props} />,
            null,
            null,
            'tbody');
    }

    it('renders nothing when no narts thrown', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 0,
                },
                away: {
                    noOfDarts: 0,
                },
            }
        });

        expect(context.container.innerHTML).toEqual('');
    });

    it('renders 2 player statistics for leg without winner', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [],
                },
                startingScore: 501,
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });

        const cells = Array.from(context.container.querySelectorAll('tr td'));
        const cellText = cells.map(td => td.textContent);
        expect(cellText).toEqual([
            'Leg: 1🔍',
            'Average: 100 (3 darts)Remaining: 401',
            'Average: 50 (3 darts)Remaining: 451']);
    });

    it('renders 2 player statistics for leg with home winner', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 100
                    }],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [{
                        score: 50
                    }],
                },
                startingScore: 501,
                winner: 'home',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });

        const cells = Array.from(context.container.querySelectorAll('tr td'));
        const cellText = cells.map(td => td.textContent);
        expect(cellText).toEqual([
            'Leg: 1Winner: HOME🔍',
            'Average: 100 (3 darts)Checkout: 100',
            'Average: 50 (3 darts)Remaining: 451']);
    });

    it('renders 2 player statistics for leg with away winner', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 100
                    }],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [{
                        score: 50
                    }],
                },
                startingScore: 501,
                winner: 'away',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });

        const cells = Array.from(context.container.querySelectorAll('tr td'));
        const cellText = cells.map(td => td.textContent);
        expect(cellText).toEqual([
            'Leg: 1Winner: AWAY🔍',
            'Average: 100 (3 darts)Remaining: 401',
            'Average: 50 (3 darts)Checkout: 50']);
    });

    it('renders single player statistics for leg with winner', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 100
                    }],
                },
                away: {},
                startingScore: 501,
                winner: 'home',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: true,
            oneDartAverage: false,
        });

        const cells = Array.from(context.container.querySelectorAll('tr td'));
        const cellText = cells.map(td => td.textContent);
        expect(cellText).toEqual([
            'Leg: 1🔍',
            'Average: 100 (3 darts)Checkout: 100']);
    });

    it('renders single player statistics for leg without winner', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 100
                    }],
                },
                away: {},
                startingScore: 501,
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: true,
            oneDartAverage: false,
        });

        const cells = Array.from(context.container.querySelectorAll('tr td'));
        const cellText = cells.map(td => td.textContent);
        expect(cellText).toEqual([
            'Leg: 1🔍',
            'Average: 100 (3 darts)Remaining: 401']);
    });

    it('can expand 2 player statistics', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 100
                    }],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [{
                        score: 50
                    }],
                },
                startingScore: 501,
                winner: 'away',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });
        const firstCell = context.container.querySelector('tr td:first-child');
        const toggle = firstCell.querySelector('input[id^="showThrows_"]');

        await doClick(toggle);

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) ol li'));
        expect(homeThrows.map(li => li.textContent)).toEqual([ '100' ]);
        expect(homeThrows.map(li => li.title)).toEqual([ 'Running score: 401' ]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) ol li'));
        expect(awayThrows.map(li => li.textContent)).toEqual([ '50' ]);
        expect(awayThrows.map(li => li.title)).toEqual([ 'Running score: 451' ]);
    });

    it('can expand 2 player statistics with no throws', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [],
                },
                startingScore: 501,
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });
        const firstCell = context.container.querySelector('tr td:first-child');
        const toggle = firstCell.querySelector('input[id^="showThrows_"]');

        await doClick(toggle);

        const homeThrows = context.container.querySelector('tr td:nth-child(2) p');
        expect(homeThrows.textContent).toEqual('No throws');
        const awayThrows = context.container.querySelector('tr td:nth-child(3) p');
        expect(awayThrows.textContent).toEqual('No throws');
    });

    it('can single player expand statistics', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 100
                    }],
                },
                away: {},
                startingScore: 501,
                winner: 'away',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: true,
            oneDartAverage: false,
        });
        const firstCell = context.container.querySelector('tr td:first-child');
        const toggle = firstCell.querySelector('input[id^="showThrows_"]');

        await doClick(toggle);

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) ol li'));
        expect(homeThrows.map(li => li.textContent)).toEqual([ '100' ]);
        expect(homeThrows.map(li => li.title)).toEqual([ 'Running score: 401' ]);
    });

    it('can toggle expanded statistics to show averages', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 100,
                        noOfDarts: 3,
                    }],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [{
                        score: 50,
                        noOfDarts: 3,
                    }],
                },
                startingScore: 501,
                winner: 'away',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });
        const firstCell = context.container.querySelector('tr td:first-child');

        await doClick(firstCell, 'input[id^="showThrows_"]');
        await doClick(firstCell, 'input[id^="average_"]');

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) ol li'));
        expect(homeThrows.map(li => li.textContent)).toEqual([ '100 (avg 100)' ]);
        expect(homeThrows.map(li => li.title)).toEqual([ 'Running score: 401' ]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) ol li'));
        expect(awayThrows.map(li => li.textContent)).toEqual([ '50 (avg 50)' ]);
        expect(awayThrows.map(li => li.title)).toEqual([ 'Running score: 451' ]);
    });

    it('can toggle expanded statistics to show scores counting down', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 100
                    }],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [{
                        score: 50
                    }],
                },
                startingScore: 501,
                winner: 'away',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });
        const firstCell = context.container.querySelector('tr td:first-child');

        await doClick(firstCell, 'input[id^="showThrows_"]');
        await doClick(firstCell, 'input[id^="metric_"]');

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) ol li'));
        expect(homeThrows.map(li => li.textContent)).toEqual([ '401' ]);
        expect(homeThrows.map(li => li.title)).toEqual([ 'Running score: 401' ]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) ol li'));
        expect(awayThrows.map(li => li.textContent)).toEqual([ '451' ]);
        expect(awayThrows.map(li => li.title)).toEqual([ 'Running score: 451' ]);
    });
});