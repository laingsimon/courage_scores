// noinspection JSUnresolvedFunction

import {cleanUp, doClick, findButton, renderApp} from "../../../helpers/tests";
import React from "react";
import {LegStatistics} from "./LegStatistics";

describe('LegStatistics', () => {
    let context;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {},
            <LegStatistics {...props} />,
            null,
            null,
            'tbody');
    }

    function getCellContent(tr) {
        return Array.from(tr.querySelectorAll('td')).map(td => {
            let content = td.textContent;

            if (td.className.indexOf('text-decoration-line-through') !== -1) {
                content = '~~' + content + '~~';
            }
            if (td.className.indexOf('fw-bold') !== -1) {
                content = '**' + content + '**';
            }
            if (td.className.indexOf('text-danger') !== -1) {
                content = '_' + content + '_';
            }

            return content;
        });
    }

    it('renders nothing when no darts thrown', async () => {
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
            'Leg: 1Details',
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
            'Leg: 1Winner: HOMEDetails',
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
            'Leg: 1Winner: AWAYDetails',
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
            'Leg: 1Details',
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
            'Leg: 1Details',
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
                startingScore: 100,
                winner: 'away',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });
        const firstCell = context.container.querySelector('tr td:first-child');

        await doClick(firstCell.querySelector('input[id^="showThrows_"]'));

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
        expect(homeThrows.map(getCellContent)).toEqual([['_100_', '0', '']]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
        expect(awayThrows.map(getCellContent)).toEqual([['50', '50', '']]);
    });

    it('can expand 2 player statistics with bust scores', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 120,
                        bust: true,
                    }],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [{
                        score: 50
                    }],
                },
                startingScore: 100,
                winner: 'away',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });
        const firstCell = context.container.querySelector('tr td:first-child');

        await doClick(firstCell.querySelector('input[id^="showThrows_"]'));

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
        expect(homeThrows.map(getCellContent)).toEqual([['_~~120~~_', '100', '']]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
        expect(awayThrows.map(getCellContent)).toEqual([['50', '50', '']]);
    });

    it('can expand 2 player statistics with 180s', async () => {
        await renderComponent({
            leg: {
                home: {
                    noOfDarts: 3,
                    score: 100,
                    throws: [{
                        score: 180,
                    }],
                },
                away: {
                    noOfDarts: 3,
                    score: 50,
                    throws: [{
                        score: 50
                    }],
                },
                startingScore: 200,
                winner: 'away',
            },
            home: 'HOME',
            away: 'AWAY',
            legNumber: 1,
            singlePlayer: false,
            oneDartAverage: false,
        });
        const firstCell = context.container.querySelector('tr td:first-child');

        await doClick(firstCell.querySelector('input[id^="showThrows_"]'));

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
        expect(homeThrows.map(getCellContent)).toEqual([['_**180**_', '20', '']]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
        expect(awayThrows.map(getCellContent)).toEqual([['50', '150', '']]);
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

        await doClick(firstCell.querySelector('input[id^="showThrows_"]'));

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
                        score: 100,
                        noOfDarts: 3,
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

        await doClick(firstCell.querySelector('input[id^="showThrows_"]'));

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
        expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '3']]);
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
        await doClick(findButton(firstCell, 'Click to show running average'));

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
        expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '100']]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
        expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '50']]);
    });

    it('can toggle expanded statistics to show no of darts', async () => {
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

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
        expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '3']]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
        expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '3']]);
    });

    it('can toggle expanded statistics to show 1-dart averages', async () => {
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
            oneDartAverage: true,
        });
        const firstCell = context.container.querySelector('tr td:first-child');

        await doClick(firstCell, 'input[id^="showThrows_"]');
        await doClick(findButton(firstCell, 'Click to show running average'));

        const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
        expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '33.33']]);
        const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
        expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '16.67']]);
    });
});