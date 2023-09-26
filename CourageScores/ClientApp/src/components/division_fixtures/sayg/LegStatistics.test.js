// noinspection JSUnresolvedFunction

import {cleanUp, doClick, findButton, renderApp, doChange} from "../../../helpers/tests";
import React from "react";
import {LegStatistics} from "./LegStatistics";
import {legBuilder} from "../../../helpers/builders";

describe('LegStatistics', () => {
    let context;
    let newLegDisplayOptions;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        newLegDisplayOptions = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {},
            <LegStatistics {...props} updateLegDisplayOptions={op => newLegDisplayOptions = op} />,
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

    describe('renders', () => {
        it('when no darts thrown', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(0))
                    .away(c => c.noOfDarts(0))
                    .build(),
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
            });

            expect(context.container.innerHTML).toEqual('');
        });

        it('2 player match without winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100))
                    .away(c => c.noOfDarts(3).score(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Details',
                'Average: 100 (3 darts)Remaining: 401',
                'Average: 50 (3 darts)Remaining: 451']);
        });

        it('2 player match with home winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50))
                    .startingScore(501)
                    .winner('home')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Winner: HOMEDetails',
                'Average: 100 (3 darts)Checkout: 100',
                'Average: 50 (3 darts)Remaining: 451']);
        });

        it('2 player match away winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Winner: AWAYDetails',
                'Average: 100 (3 darts)Remaining: 401',
                'Average: 50 (3 darts)Checkout: 50']);
        });

        it('single player match with winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100))
                    .away({})
                    .startingScore(501)
                    .winner('home')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: true,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Details',
                'Average: 100 (3 darts)Checkout: 100']);
        });

        it('single player match without winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100))
                    .away({})
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: true,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Details',
                'Average: 100 (3 darts)Remaining: 401']);
        });

        it('2 player throws', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50))
                    .startingScore(100)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '0', '']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '50', '']]);
        });

        it('2 player match with bust scores', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(120, true))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50))
                    .startingScore(100)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_~~120~~_', '100', '']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '50', '']]);
        });

        it('2 player match with 180s', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(180))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50))
                    .startingScore(200)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_**180**_', '20', '']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '150', '']]);
        });

        it('2 player match with no throws', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100))
                    .away(c => c.noOfDarts(3).score(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });

            const homeThrows = context.container.querySelector('tr td:nth-child(2) p');
            expect(homeThrows.textContent).toEqual('No throws');
            const awayThrows = context.container.querySelector('tr td:nth-child(3) p');
            expect(awayThrows.textContent).toEqual('No throws');
        });

        it('single player throws', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away({})
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: true,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '3']]);
        });

        it('averages', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: true,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '100']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '50']]);
        });

        it('no of darts', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '3']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '3']]);
        });

        it('1-dart averages', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: true,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '33.33']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '16.67']]);
        });
    });

    describe('interactivity', () => {
        it('can expand 2 player statistics', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50))
                    .startingScore(100)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
            });
            const firstCell = context.container.querySelector('tr td:first-child');

            await doClick(firstCell.querySelector('input[name="showThrows"]'));

            expect(newLegDisplayOptions).toEqual({
                showThrows: true,
                showAverage: false,
            });
        });

        it('can toggle expanded statistics to show averages', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });
            const firstCell = context.container.querySelector('tr td:first-child');

            await doClick(findButton(firstCell, 'Click to show running average'));

            expect(newLegDisplayOptions).toEqual({
                showThrows: true,
                showAverage: true,
            });
        });

        it('can open change throw dialog', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: () => {},
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);

            expect(context.container.textContent).toContain('Edit throw');
        });

        it('can close change throw dialog', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: () => {},
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });
            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);
            expect(context.container.textContent).toContain('Edit throw');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Edit throw');
        });

        it('can change throw', async () => {
            let newLeg;
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: (value) => newLeg = value,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });
            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);

            await doChange(context.container, 'input[name="score"]', '105', context.user);
            await doChange(context.container, 'input[name="noOfDarts"]', '2', context.user);
            await doClick(context.container, 'input[name="bust"]');
            await doClick(findButton(context.container, 'Save changes'));

            expect(newLeg.home).toEqual({
                bust: false,
                noOfDarts: 2,
                score: 105,
                throws: [
                    { bust: true, score: 105, noOfDarts: 2 },
                ],
            });
        });

        it('removes throw when noOfDarts set to 0', async () => {
            let newLeg;
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: (value) => newLeg = value,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });
            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);

            await doChange(context.container, 'input[name="noOfDarts"]', '0', context.user);
            await doClick(findButton(context.container, 'Save changes'));

            expect(newLeg.home).toEqual({
                bust: false,
                noOfDarts: 0,
                score: 0,
                throws: [],
            });
        });

        it('cannot change throw when no handler', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home(c => c.noOfDarts(3).score(100).withThrow(100, false, 3))
                    .away(c => c.noOfDarts(3).score(50).withThrow(50, false, 3))
                    .startingScore(501)
                    .winner('away')
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: null,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);

            expect(context.container.textContent).not.toContain('Edit throw');
        });
    });
});