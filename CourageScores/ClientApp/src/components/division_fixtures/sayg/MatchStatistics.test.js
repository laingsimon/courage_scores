// noinspection JSUnresolvedFunction

import {cleanUp, doClick, doSelectOption, findButton, renderApp} from "../../../helpers/tests";
import React from "react";
import {MatchStatistics} from "./MatchStatistics";
import {legBuilder} from "../../../helpers/builders";
import {SaygLoadingContainer} from "./SaygLoadingContainer";
import {createTemporaryId} from "../../../helpers/projection";
import {act} from "@testing-library/react";

describe('MatchStatistics', () => {
    let context;
    let getCount;
    let saygData;
    const saygApi = {
        get: () => {
            getCount++;
            return saygData;
        }
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        const saygId = createTemporaryId();
        getCount = 0;
        saygData = Object.assign({ id: saygId }, props);
        context = await renderApp(
            {saygApi},
            {name: 'Courage Scores'},
            {},
            <SaygLoadingContainer id={saygId} matchStatisticsOnly={true}>
                <MatchStatistics {...props} />
            </SaygLoadingContainer>);
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
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();

        await renderComponent({
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            home: 'HOME',
            away: 'AWAY',
            singlePlayer: false,
            numberOfLegs: 3,
        });

        assertHeaderText(['', 'HOME', 'AWAY'], true, false);
        assertScoreRow(['Score', '3', '2'], true, false);
        assertLegRow(
            0,
            [
                'Leg: 1Details',
                'Average: 123 (3 darts)Remaining: 378',
                'Average: 125 (6 darts)Remaining: 251']);
        assertMatchAverage(['Match average3️⃣', '123', '125'], false, true);
        assertMatchDartCount(['Match darts', '3', '6'], true, false);
    });

    it('renders single player statistics', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away({})
            .winner('home')
            .build();

        await renderComponent({
            legs: {0: leg},
            homeScore: 3,
            home: 'HOME',
            singlePlayer: true,
            numberOfLegs: 3,
        });

        assertHeaderText([]);
        assertScoreRow(['Score', '3']);
        assertLegRow(
            0,
            [
                'Leg: 1Details',
                'Average: 123 (3 darts)Checkout: 123']);
        assertMatchAverage(['Match average3️⃣', '123']);
        assertMatchDartCount(['Match darts', '3'], true);
    });

    it('can expand leg to show throws', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        await renderComponent({
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            home: 'HOME',
            away: 'AWAY',
            singlePlayer: false,
            numberOfLegs: 3,
        });

        await doClick(context.container.querySelector('input[name="showThrows"]'));

        assertLegRow(
            0,
            [
                'Leg: 1DetailsClick to show running average',
                'Average: 123 (3 darts)Remaining: 378ThrewScoreDarts1233783',
                '123', '378', '3',
                'Average: 125 (6 darts)Remaining: 251ThrewScoreDarts10040131502513',
                '100', '401', '3',
                '150', '251', '3']);
    });

    it('can toggle leg to show averages', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        await renderComponent({
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            home: 'HOME',
            away: 'AWAY',
            singlePlayer: false,
            numberOfLegs: 3,
        });

        await doClick(context.container.querySelector('input[name="showThrows"]'));
        await doClick(findButton(context.container, 'Click to show running average'));

        assertLegRow(
            0,
            [
                'Leg: 1DetailsClick to show No. of darts',
                'Average: 123 (3 darts)Remaining: 378ThrewScoreAvg123378123',
                '123', '378', '123',
                'Average: 125 (6 darts)Remaining: 251ThrewScoreAvg100401100150251125',
                '100', '401', '100',
                '150', '251', '125']);
    });

    it('allows throw to be edited when change handler is passed in', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        let changed;
        await renderComponent({
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            home: 'HOME',
            away: 'AWAY',
            singlePlayer: false,
            numberOfLegs: 3,
            legChanged: () => { changed = true; },
        });
        await doClick(context.container.querySelector('input[name="showThrows"]'));
        const legRow = context.container.querySelector('table tbody tr:nth-child(2)');

        await doClick(legRow, 'table tbody tr:nth-child(2)');
        expect(context.container.querySelector('.modal-dialog')).toBeTruthy();
        expect(context.container.querySelector('.modal-dialog').textContent).toContain('Edit throw');
        await doClick(findButton(legRow, 'Save changes'));

        expect(changed).toEqual(true);
    });

    it('prevents edit of throw when no change handler is passed in', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        await renderComponent({
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            home: 'HOME',
            away: 'AWAY',
            singlePlayer: false,
            numberOfLegs: 3,
        });
        await doClick(context.container.querySelector('input[name="showThrows"]'));
        const legRow = context.container.querySelector('table tbody tr:nth-child(2)');

        await doClick(legRow, 'table tbody tr:nth-child(2)');

        expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
    });

    it('does not render refresh options when not allowed', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c)
            .winner('home')
            .build();

        await renderComponent({
            legs: {0: leg},
            homeScore: 1,
            home: 'HOME',
            singlePlayer: true,
            refreshAllowed: false,
            numberOfLegs: 3,
        });

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeFalsy();
        expect(context.container.querySelector('h4').textContent).not.toContain('⏸️');
    });

    it('does not render refresh options when home has won', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.noOfDarts(1))
            .winner('home')
            .build();

        await renderComponent({
            legs: {0: leg},
            homeScore: 2,
            home: 'HOME',
            refreshAllowed: true,
            numberOfLegs: 3,
        });

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeFalsy();
        expect(context.container.querySelector('h4').textContent).toContain('⏸️');
    });

    it('does not render refresh options when away has won', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.noOfDarts(1))
            .winner('home')
            .build();

        await renderComponent({
            legs: {0: leg},
            homeScore: 0,
            awayScore: 2,
            home: 'HOME',
            refreshAllowed: true,
            numberOfLegs: 3,
        });

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeFalsy();
        expect(context.container.querySelector('h4').textContent).toContain('⏸️');
    });

    it('selects default refresh interval', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c)
            .away(c => c)
            .build();

        await renderComponent({
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            home: 'HOME',
            refreshAllowed: true,
            numberOfLegs: 3,
            initialRefreshInterval: 10000,
        });

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeTruthy();
        expect(context.container.querySelector('h4 .dropdown-item.active').textContent).toEqual('▶️ Live: Fast');
    });

    it('shows throws on last leg when not finished', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away(c => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();

        await renderComponent({
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            home: 'HOME',
            refreshAllowed: true,
            numberOfLegs: 3,
            initialRefreshInterval: 10000,
        });

        assertLegRow(
            0,
            [
                'Leg: 1running average',
                'Average: 100 (3 darts)Remaining: 401ThrewScoreAvg100401100',
                '100',
                '401',
                '100',
                'Average: 112.5 (2 darts)Remaining: 426ThrewScoreAvg75426112.5',
                '75',
                '426',
                '112.5',
            ]);
    });

    it('repeatedly refreshes sayg data', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away(c => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        let interval;
        window.setInterval = (handler, delay) => {
            interval = { handler, delay };
            return 123;
        };

        await renderComponent({
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            home: 'HOME',
            refreshAllowed: true,
            numberOfLegs: 3,
            initialRefreshInterval: 10000,
        });

        expect(interval).toEqual({
            handler: expect.any(Function),
            delay: 10000,
        });
        expect(getCount).toEqual(1);
        await act(async () => {
            await interval.handler();
        });
        expect(getCount).toEqual(2);
    });

    it('cancels refresh of data when paused', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away(c => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        let clearedHandle;
        window.setInterval = () => {
            return 123;
        };
        window.clearInterval = (handle) => {
            clearedHandle = handle;
        }
        await renderComponent({
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            home: 'HOME',
            refreshAllowed: true,
            numberOfLegs: 3,
            initialRefreshInterval: 10000,
        });

        await doSelectOption(context.container.querySelector('h4 .dropdown-menu'), '⏸️ No refresh');

        expect(clearedHandle).toEqual(123);
    });
});