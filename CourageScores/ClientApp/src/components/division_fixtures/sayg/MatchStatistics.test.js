// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {MatchStatistics} from "./MatchStatistics";

describe('MatchStatistics', () => {
    let context;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        context = await renderApp(
            { },
            { name: 'Courage Scores' },
            { },
            <MatchStatistics {...props} />);
    }

    function assertHeaderText(expected, homeWinner, awayWinner) {
        const table = context.container.querySelector('table');
        const row = table.querySelector('thead tr');
        if (expected.length === 0) {
            expect(row).toBeFalsy();
            return;
        }

        const headerText = Array.from(row.querySelectorAll('th')).map(th => th.textContent);
        expect(headerText).toEqual(expected);
        assertColumnClassNames(row, 'th', 'text-primary', homeWinner, awayWinner);
    }

    function assertMatchAverage(expected, homeWinner, awayWinner) {
        const table = context.container.querySelector('table');
        const row = table.querySelector('tfoot tr:nth-child(1)');
        const rowText = Array.from(row.querySelectorAll('td')).map(th => th.textContent);
        expect(rowText).toEqual(expected);
        assertColumnClassNames(row, 'td', 'bg-winner', homeWinner, awayWinner);
    }

    function assertMatchDartCount(expected, homeWinner, awayWinner) {
        const table = context.container.querySelector('table');
        const row = table.querySelector('tfoot tr:nth-child(2)');
        const rowText = Array.from(row.querySelectorAll('td')).map(th => th.textContent);
        expect(rowText).toEqual(expected);
        assertColumnClassNames(row, 'td', 'bg-winner', homeWinner, awayWinner);
    }

    function assertScoreRow(expected, homeWinner, awayWinner) {
        const table = context.container.querySelector('table');
        const row = table.querySelector('tbody tr:nth-child(1)');
        const rowText = Array.from(row.querySelectorAll('td')).map(th => th.textContent);
        expect(rowText).toEqual(expected);
        assertColumnClassNames(row, 'td', 'bg-winner text-primary', homeWinner, awayWinner);
    }

    function assertColumnClassNames(row, nodeName, className, home, away) {
        const homeCell = row.querySelector(nodeName + ':nth-child(2)');
        expect(homeCell).toBeTruthy();
        if (home) {
            expect(homeCell.className).toContain(className);
        } else {
            expect(homeCell.className).not.toContain(className);
        }

        if (away !== null && away !== undefined) {
            const awayCell = row.querySelector(nodeName + ':nth-child(3)');
            expect(awayCell).toBeTruthy();
            if (away) {
                expect(awayCell.className).toContain(className);
            } else {
                expect(awayCell.className).not.toContain(className);
            }
        }
    }

    function assertLegRow(legIndex, expected, homeWinner, awayWinner) {
        const table = context.container.querySelector('table');
        const rowOrdinal = legIndex + 2;
        const row = table.querySelector(`tbody tr:nth-child(${rowOrdinal})`);
        const rowText = Array.from(row.querySelectorAll('td')).map(th => th.textContent);
        expect(rowText).toEqual(expected);
        assertColumnClassNames(row, 'td', 'bg-winner text-primary', homeWinner, awayWinner);
    }

    it('renders 2 player statistics', async () => {
        const leg = {
            currentThrow: 'home',
            startingScore: 501,
            home: {
                throws: [{
                    score: 123,
                    noOfDarts: 3,
                }],
                score: 123,
                noOfDarts: 3,
                bust: false,
            },
            away: {
                throws: [ {
                    score: 100,
                    noOfDarts: 3,
                }, {
                    score: 150,
                    noOfDarts: 3,
                }],
                score: 250,
                noOfDarts: 6,
                bust: false,
            },
        };
        await renderComponent({
            legs: { 0: leg },
            homeScore: 3,
            awayScore: 2,
            home: 'HOME',
            away: 'AWAY',
            singlePlayer: false,
        });

        assertHeaderText(['', 'HOME', 'AWAY'], true, false);
        assertScoreRow(['Score', '3', '2'], true, false);
        assertLegRow(
            0,
            [
                'Leg: 1🔍',
                'Average: 123 (3 darts)Remaining: 378',
                'Average: 125 (6 darts)Remaining: 251']);
        assertMatchAverage(['Match average3️⃣','123','125'], false, true);
        assertMatchDartCount(['Match darts','3','6'], true, false);
    });

    it('renders single player statistics', async () => {
        const leg = {
            currentThrow: 'home',
            startingScore: 501,
            home: {
                throws: [{
                    score: 123,
                    noOfDarts: 3,
                }],
                score: 123,
                noOfDarts: 3,
                bust: false,
            },
            away: { },
            winner: 'home',
        };
        await renderComponent({
            legs: { 0: leg },
            homeScore: 3,
            home: 'HOME',
            singlePlayer: true,
        });

        assertHeaderText([]);
        assertScoreRow(['Score', '3']);
        assertLegRow(
            0,
            [
                'Leg: 1🔍',
                'Average: 123 (3 darts)Checkout: 123']);
        assertMatchAverage(['Match average3️⃣','123']);
        assertMatchDartCount(['Match darts','3'], true);
    });
});