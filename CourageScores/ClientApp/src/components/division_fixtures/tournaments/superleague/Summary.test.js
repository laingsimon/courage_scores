// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {Summary} from "./Summary";

describe('Summary', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        reportedError = null;
        context = await renderApp(
            {},
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
            (<Summary {...props} />));
    }

    function getRowContent(row, tagName) {
        return Array.from(row.querySelectorAll(tagName)).map(th => th.textContent);
    }

    function createLeg(homeWinner, awayWinner) {
        const winningThrows = [
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 100, bust: false, noOfDarts: 3 },
            { score: 110, bust: false, noOfDarts: 3 },
            { score: 120, bust: false, noOfDarts: 3 },
            { score: 81, bust: false, noOfDarts: 3 },
        ];
        const notWinningThrows = [
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 90, bust: false, noOfDarts: 3 },
        ];

        return {
            home: {
                throws: homeWinner ? winningThrows : notWinningThrows
            },
            away: {
                throws: awayWinner ? winningThrows : notWinningThrows
            },
            startingScore: 501,
        };
    }

    describe('renders', () => {
        it('when no sayg matches', async () => {
            await renderComponent({
                showWinner: false,
                saygMatches: [ ],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('No matches');
        });

        it('correct row headings', async () => {
            const saygMatch = {
                match: {
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                    scoreA: 1,
                    scoreB: 2,
                },
                saygData: {
                    legs: {
                        '0': createLeg(true, false),
                        '1': createLeg(true, false),
                    }
                }
            }

            await renderComponent({
                showWinner: false,
                saygMatches: [ saygMatch ],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('table thead tr'));
            expect(rows.length).toEqual(1);
            expect(getRowContent(rows[0], 'th')).toEqual([
                'Match no',
                'HOSTPlayer', 'Legs won', 'Total tons', '100+', '140+', '180', 'Player average',
                'OPPONENTPlayer', 'Legs won', 'Total tons', '100+', '140+', '180', 'Player average'
            ]);
        });

        it('sayg matches', async () => {
            const saygMatch = {
                match: {
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                    scoreA: 1,
                    scoreB: 2,
                },
                saygData: {
                    legs: {
                        '0': createLeg(true, false),
                        '1': createLeg(true, false),
                    }
                }
            }

            await renderComponent({
                showWinner: false,
                saygMatches: [ saygMatch ],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('table.table tbody tr'));
            expect(rows.length).toEqual(1 + 1);
            expect(getRowContent(rows[0], 'td')).toEqual([
                '1', 'A', '1', '6', '6', '0', '0', '33.4',
                'B', '2', '0', '0', '0', '0', '30',
            ]);
        });

        it('total row', async () => {
            const saygMatch = {
                match: {
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                    scoreA: 1,
                    scoreB: 2,
                },
                saygData: {
                    legs: {
                        '0': createLeg(true, false),
                        '1': createLeg(true, false),
                    }
                }
            }

            await renderComponent({
                showWinner: false,
                saygMatches: [ saygMatch ],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('table.table tbody tr'));
            expect(rows.length).toEqual(1 + 1);
            expect(getRowContent(rows[1], 'td')).toEqual([
                '',
                'Total', '1', '0', '0', '0', '0', '33.4',
                'Total', '2', '0', '0', '0', '0', '30',
            ]);
        });

        it('rounded average', async () => {
            const saygMatch = {
                match: {
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                    scoreA: 1,
                    scoreB: 2,
                },
                saygData: {
                    legs: {
                        '0': createLeg(true, false),
                        '1': createLeg(true, false),
                    }
                }
            }

            await renderComponent({
                showWinner: false,
                saygMatches: [ saygMatch ],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('table.table tfoot tr'));
            expect(rows.length).toEqual(2);
            expect(getRowContent(rows[0], 'td')).toEqual([
                '',
                'Rounded average', '11.13',
                '',
                'Rounded average', '10',
            ]);
        });

        it('darts for windows average', async () => {
            const saygMatch = {
                match: {
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                    scoreA: 1,
                    scoreB: 2,
                },
                saygData: {
                    legs: {
                        '0': createLeg(true, false),
                        '1': createLeg(false, true),
                        '2': createLeg(true, false),
                    }
                }
            }

            await renderComponent({
                showWinner: false,
                saygMatches: [ saygMatch ],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('table.table tfoot tr'));
            expect(rows.length).toEqual(2);
            expect(getRowContent(rows[1], 'td')).toEqual([
                '',
                'Darts for windows average',
                '8.96',
                '',
                'Darts for windows average',
                '17.3'
            ]);
        });
    });
});