// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {MatchLog} from "./MatchLog";
import {createTemporaryId} from "../../../../helpers/projection";

describe('MatchLog', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        reportedError = null;
        context = await renderApp(
            {},
            null,
            {
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
            },
            (<MatchLog {...props} />));
    }

    function createLeg(homeScore, awayScore) {
        return {
            home: {
                throws: [
                    { score: homeScore, bust: false, noOfDarts: 3 },
                ],
            },
            away: {
                throws: [
                    { score: awayScore, bust: false, noOfDarts: 3 },
                ],
            },
            startingScore: 501,
        };
    }

    function rowContent(row, tagName) {
        return Array.from(row.querySelectorAll(tagName)).map(cell => cell.textContent);
    }

    function after(iterable, afterText) {
        let collect = false;
        const items = [];

        for (let index = 0; index < iterable.length; index++) {
            const item = iterable[index];
            if (item === afterText) {
                collect = true;
                continue;
            }

            if (collect) {
                items.push(item);
            }
        }

        return items;
    }

    describe('renders', () => {
        it('when no sayg data', async () => {
            const saygMatch = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: null,
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch ]
            });

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('⚠ No data available for the match between A and B');
        });

        it('when no sayg legs', async () => {
            const saygMatch = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: { legs: null },
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch ]
            });

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('⚠ No data available for the match between A and B');
        });

        it('correct number of throw columns', async () => {
            const saygMatch = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(100, 50),
                    }
                },
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch ]
            });

            expect(reportedError).toBeNull();
            const table = Array.from(context.container.querySelectorAll('table.table'))[0];
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            /* 2 heading rows, 3 data rows - repeated for home and away */
            const hostHeadings = rowContent(rows[1], 'th');
            expect(after(hostHeadings, 'GD')).toEqual([ '1', '2', '3', '4', '5', '6' ]);
            const opponentHeadings = rowContent(rows[4], 'th');
            expect(after(opponentHeadings, 'GD')).toEqual([ '1', '2', '3', '4', '5', '6' ]);
        });

        it('first match content for host', async () => {
            const saygMatch = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(100, 50),
                        '1': createLeg(100, 50),
                        '2': createLeg(100, 50),
                    }
                },
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch ]
            });

            expect(reportedError).toBeNull();
            const table = Array.from(context.container.querySelectorAll('table.table'))[0];
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            /* 2 heading rows, 3 data rows - repeated for home and away */
            expect(rows.length).toEqual(2 + 3 + 2 + 3);
            expect(rowContent(rows[0], 'th')).toEqual([ 'HOST', 'Dart average', '', '' ]);
            expect(rowContent(rows[1], 'th')).toEqual([ 'Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4', '5', '6' ]);
            expect(rowContent(rows[2], 'td')).toEqual([ 'A', '1', '3', '', '401', '1', '0', '0', '1', '33.33', '33.33', '3', '100', '', '', '', '', '' ]);
            expect(rowContent(rows[3], 'td')).toEqual([      '2', '3', '', '401', '1', '0', '0', '1', '3', '100', '', '', '', '', '' ]);
            expect(rowContent(rows[4], 'td')).toEqual([      '3', '3', '', '401', '1', '0', '0', '1', '3', '100', '', '', '', '', '' ]);
        });

        it('first match content for opponent', async () => {
            const saygMatch = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(100, 50),
                        '1': createLeg(100, 50),
                        '2': createLeg(100, 50),
                    }
                },
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch ]
            });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            /* 2 heading rows, 3 data rows - repeated for home and away */
            expect(rows.length).toEqual(2 + 3 + 2 + 3);
            expect(rowContent(rows[5], 'th')).toEqual([ 'OPPONENT', 'Dart average', '', '' ]);
            expect(rowContent(rows[6], 'th')).toEqual([ 'Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4', '5', '6' ]);
            expect(rowContent(rows[7], 'td')).toEqual([ 'B', '1', '3', '', '451', '0', '0', '0', '0', '16.67', '16.67', '3', '50', '', '', '', '', '' ]);
            expect(rowContent(rows[8], 'td')).toEqual([      '2', '3', '', '451', '0', '0', '0', '0', '3', '50', '', '', '', '', '' ]);
            expect(rowContent(rows[9], 'td')).toEqual([      '3', '3', '', '451', '0', '0', '0', '0', '3', '50', '', '', '', '', '' ]);
        });

        it('second match content for host', async () => {
            const saygMatch1 = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(50, 25),
                    }
                },
            };
            const saygMatch2 = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'C' },
                    sideB: { name: 'D' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(100, 50),
                    }
                },
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch1, saygMatch2 ]
            });

            expect(reportedError).toBeNull();
            const firstMatchTable = Array.from(context.container.querySelectorAll('table.table'))[0];
            const secondMatchTable = Array.from(context.container.querySelectorAll('table.table'))[1];
            const firstMatchRows = Array.from(firstMatchTable.querySelectorAll('tbody tr'));
            const secondMatchRows = Array.from(secondMatchTable.querySelectorAll('tbody tr'));
            /* 2 heading rows, 3 data rows - repeated for home and away */
            expect(secondMatchRows.length).toEqual(2 + 1 + 2 + 1);
            expect(rowContent(secondMatchRows[0], 'th')).toEqual([ 'HOST', 'Dart average', '', '' ]);
            expect(rowContent(secondMatchRows[1], 'th')).toEqual([ 'Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4', '5', '6' ]);
            const firstMatchPlayerAverage = 16.67;
            const secondMatchPlayerAverage = 33.33;
            const overallMatchPlayerAverage = firstMatchPlayerAverage + secondMatchPlayerAverage;
            expect(rowContent(firstMatchRows[2], 'td')).toEqual([ 'A', '1', '3', '', '451', '0', '0', '0', '0', firstMatchPlayerAverage.toString(), firstMatchPlayerAverage.toString(), '3', '50', '', '', '', '', '' ]);
            expect(rowContent(secondMatchRows[2], 'td')).toEqual([ 'C', '1', '3', '', '401', '1', '0', '0', '1', secondMatchPlayerAverage.toString(), overallMatchPlayerAverage.toString(), '3', '100', '', '', '', '', '' ]);
        });

        it('second match content for opponent', async () => {
            const saygMatch1 = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(50, 25),
                    }
                },
            };
            const saygMatch2 = {
                match: {
                    id: createTemporaryId(),
                    sideA: { name: 'C' },
                    sideB: { name: 'D' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(100, 50),
                    }
                },
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch1, saygMatch2 ]
            });

            expect(reportedError).toBeNull();
            const firstMatchTable = Array.from(context.container.querySelectorAll('table.table'))[0];
            const secondMatchTable = Array.from(context.container.querySelectorAll('table.table'))[1];
            const firstMatchRows = Array.from(firstMatchTable.querySelectorAll('tbody tr'));
            const secondMatchRows = Array.from(secondMatchTable.querySelectorAll('tbody tr'));
            /* 2 heading rows, 3 data rows - repeated for home and away */
            expect(secondMatchRows.length).toEqual(2 + 1 + 2 + 1);
            expect(rowContent(secondMatchRows[3], 'th')).toEqual([ 'OPPONENT', 'Dart average', '', '' ]);
            expect(rowContent(secondMatchRows[4], 'th')).toEqual([ 'Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4', '5', '6' ]);
            const firstMatchPlayerAverage = 8.33;
            const secondMatchPlayerAverage = 16.67;
            const overallMatchPlayerAverage = firstMatchPlayerAverage + secondMatchPlayerAverage;
            expect(rowContent(firstMatchRows[5], 'td')).toEqual([ 'B', '1', '3', '', '476', '0', '0', '0', '0', firstMatchPlayerAverage.toString(), firstMatchPlayerAverage.toString(), '3', '25', '', '', '', '', '' ]);
            expect(rowContent(secondMatchRows[5], 'td')).toEqual([ 'D', '1', '3', '', '451', '0', '0', '0', '0', secondMatchPlayerAverage.toString(), overallMatchPlayerAverage.toString(), '3', '50', '', '', '', '', '' ]);
        });
    });
});