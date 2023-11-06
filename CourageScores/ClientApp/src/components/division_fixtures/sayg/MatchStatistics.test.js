// noinspection JSUnresolvedFunction

import {cleanUp, doClick, doSelectOption, findButton, noop, renderApp} from "../../../helpers/tests";
import React from "react";
import {MatchStatistics} from "./MatchStatistics";
import {legBuilder} from "../../../helpers/builders";
import {SaygLoadingContainer} from "./SaygLoadingContainer";
import {createTemporaryId} from "../../../helpers/projection";
import {act} from "@testing-library/react";

describe('MatchStatistics', () => {
    let context;
    let reportedError;
    let getCount;
    let saygData;
    let updatedSayg;

    const saygApi = {
        get: () => {
            getCount++;
            return saygData;
        },
        upsert: (data) => {
            updatedSayg = data;
            return {
                success: true,
                result: data,
            };
        },
    };
    const webSocket = {
        sent: [],
        subscriptions: {},
        socket: null,
        socketFactory: () => {
            const socket = {
                close: () => {},
                readyState: 1,
                send: (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'subscribed') {
                        webSocket.subscriptions[message.id] = true;
                    } else if (message.type === 'unsubscribed') {
                        delete webSocket.subscriptions[message.id];
                    }
                    webSocket.sent.push(message);
                }
            };
            webSocket.socket = socket;
            return socket;
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = null;
        updatedSayg = null;
        getCount = 0;
        webSocket.socket = null;
        webSocket.subscriptions = {};
        webSocket.sent = [];
    });

    async function renderComponent(containerProps, data, appProps) {
        saygData = data;
        saygData.id = saygData.id || createTemporaryId();
        containerProps.liveOptions = containerProps.liveOptions || {};
        context = await renderApp(
            {saygApi, socketFactory: webSocket.socketFactory},
            {name: 'Courage Scores'},
            {
                ...appProps,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            <SaygLoadingContainer id={saygData.id} matchStatisticsOnly={true} {...containerProps} />);
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

        await renderComponent({}, {
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            yourName: 'HOME',
            opponentName: 'AWAY',
            numberOfLegs: 3,
            startingScore: 501,
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

        await renderComponent({}, {
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
        await renderComponent({}, {
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            yourName: 'HOME',
            opponentName: 'AWAY',
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
        await renderComponent({}, {
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            yourName: 'HOME',
            opponentName: 'AWAY',
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
        await renderComponent({}, {
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            yourName: 'HOME',
            opponentName: 'AWAY',
            numberOfLegs: 3,
        }, {
            account: {
                access: {
                    recordScoresAsYouGo: true
                },
            },
        });
        await doClick(context.container.querySelector('input[name="showThrows"]'));
        const legRow = context.container.querySelector('table tbody tr:nth-child(2)');

        await doClick(legRow, 'table tbody tr:nth-child(2)');
        expect(context.container.querySelector('.modal-dialog')).toBeTruthy();
        expect(context.container.querySelector('.modal-dialog').textContent).toContain('Edit throw');
        await doClick(findButton(legRow, 'Save changes'));

        expect(reportedError).toBeNull();
        expect(updatedSayg).not.toBeNull();
    });

    it('prevents edit of throw when no change handler is passed in', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        await renderComponent({}, {
            legs: {0: leg},
            homeScore: 3,
            awayScore: 2,
            yourName: 'HOME',
            opponentName: 'AWAY',
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
            livePermitted: false,
            matchStatisticsOnly: true,
        }, {
            legs: {0: leg},
            homeScore: 1,
            yourName: 'HOME',
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
        const liveOptions = {
            canSubscribe: true,
            subscribeAtStartup: true,
        };
        console.log = noop;

        await renderComponent({
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, {
            legs: {0: leg},
            homeScore: 2,
            yourName: 'HOME',
            numberOfLegs: 3,
        });

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeFalsy();
        expect(context.container.querySelector('h4').textContent).not.toContain('⏸️');
    });

    it('does not render refresh options when away has won', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away(c => c.noOfDarts(1))
            .winner('home')
            .build();
        const liveOptions = {
            canSubscribe: true,
            subscribeAtStartup: true,
        };
        console.log = noop;

        await renderComponent({
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, {
            legs: {0: leg},
            homeScore: 0,
            awayScore: 2,
            yourName: 'HOME',
            numberOfLegs: 3,
        });

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeFalsy();
        expect(context.container.querySelector('h4').textContent).not.toContain('⏸️');
    });

    it('enables live updates by default', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c)
            .away(c => c)
            .build();
        const liveOptions = {
            canSubscribe: true,
            subscribeAtStartup: true,
        };
        const id = createTemporaryId();
        console.log = noop;

        await renderComponent({
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, {
            id,
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            yourName: 'HOME',
            numberOfLegs: 3,
        });

        expect(webSocket.socket).not.toBeNull();
        expect(Object.keys(webSocket.subscriptions)).toEqual([ id ]);
    });

    it('does not enable live updates by default', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c)
            .away(c => c)
            .build();
        const liveOptions = {
            canSubscribe: true,
            subscribeAtStartup: false,
        };

        await renderComponent({
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, {
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            yourName: 'HOME',
            numberOfLegs: 3,
        });

        const selectedOption = context.container.querySelector('h4 .dropdown-menu .active');
        expect(selectedOption).toBeTruthy();
        expect(selectedOption.textContent).toEqual('⏸️ Paused');
        expect(webSocket.socket).toBeNull();
    });

    it('shows throws on last leg when not finished', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away(c => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const liveOptions = {
            canSubscribe: true,
            subscribeAtStartup: true,
        };
        const id = createTemporaryId();
        console.log = noop;

        await renderComponent({
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true, showAverage: true },
        }, {
            id,
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            yourName: 'HOME',
            opponentName: 'AWAY',
            numberOfLegs: 3,
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

    it('closes socket when live updates are canceled', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away(c => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const liveOptions = {
            canSubscribe: true,
            subscribeAtStartup: true,
        };
        console.log = noop;
        const saygId = createTemporaryId();
        await renderComponent({
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, {
            id: saygId,
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            home: 'HOME',
            numberOfLegs: 3,
        });
        expect(Object.keys(webSocket.subscriptions)).toEqual([saygId]);
        expect(reportedError).toBeNull();

        await doSelectOption(context.container.querySelector('h4 .dropdown-menu'), '⏸️ Paused');

        expect(reportedError).toBeNull();
        expect(webSocket.subscriptions).toEqual({});
    });

    it('collapses all legs when final leg played', async () => {
        const id = createTemporaryId();
        const leg = legBuilder(id)
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away(c => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const finishedLeg = legBuilder(id)
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.withThrow(501, false, 3).score(501).noOfDarts(3))
            .away(c => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const liveOptions = {
            canSubscribe: true,
            subscribeAtStartup: true,
        };
        console.log = noop;
        await renderComponent({
            liveOptions,
            lastLegDisplayOptions: { showThrows: true, initial: true },
        }, {
            id,
            legs: {0: leg},
            homeScore: 0,
            awayScore: 0,
            yourName: 'HOME',
            opponentName: 'AWAY',
            numberOfLegs: 3,
        });

        const newSaygData = {
            id,
            legs: {0: finishedLeg, 1: finishedLeg, 2: finishedLeg},
            homeScore: 2,
            awayScore: 0,
            home: 'HOME',
            opponentName: 'AWAY',
            numberOfLegs: 3,
        };
        expect(webSocket.socket).toBeTruthy();
        await act(async () => {
            webSocket.socket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    data: newSaygData,
                    id: newSaygData.id,
                })
            });
        });

        expect(reportedError).toBeNull();
        const firstRow = context.container.querySelector('table tbody tr:first-child');
        const finishedHeadings = Array.from(firstRow.querySelectorAll('td'));
        expect(finishedHeadings.map(th => th.textContent)).toEqual(['Score', '2', '0']);
    });
});