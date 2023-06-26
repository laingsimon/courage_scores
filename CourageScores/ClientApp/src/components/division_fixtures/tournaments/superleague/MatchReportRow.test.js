// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {MatchReportRow} from "./MatchReportRow";

describe('MatchReportRow', () => {
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
            (<MatchReportRow {...props} />),
            null,
            null,
            'tbody');
    }

    function getRowContent(row) {
        return Array.from(row.querySelectorAll('td')).map(th => th.textContent);
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
        it('when no sayg data', async () => {
            await renderComponent({
                matchIndex: 1,
                saygData: null,
                noOfThrows: 3,
                noOfLegs: 3,
                showWinner: false,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(rows.length).toEqual(0);
        });

        it('when no sayg legs', async () => {
            await renderComponent({
                matchIndex: 1,
                saygData: { legs: null },
                noOfThrows: 3,
                noOfLegs: 3,
                showWinner: false,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(rows.length).toEqual(0);
        });

        it('for the given number of legs', async () => {
            const saygData = {
                legs: {
                    '0': createLeg(),
                    '1': createLeg(),
                    '2': createLeg(),
                }
            }

            await renderComponent({
                matchIndex: 1,
                saygData,
                noOfThrows: 3,
                noOfLegs: 3,
                showWinner: false,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(rows.length).toEqual(3);
        });

        it('first leg', async () => {
            const saygData = {
                legs: {
                    '0': createLeg(true, false),
                }
            }

            await renderComponent({
                matchIndex: 0,
                saygData,
                noOfThrows: 3,
                noOfLegs: 1,
                showWinner: false,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(getRowContent(rows[0])).toEqual([
                'M1',
                '33.4', 'HOST', '1', '90', '100', '110', '120', '15', '81', '', '3',
                '30', 'OPPONENT', '90', '90', '90', '90', '15', '', '51', '0',
            ]);
        });

        it('second leg', async () => {
            const saygData = {
                legs: {
                    '0': createLeg(true, false),
                    '1': createLeg(false, true),
                }
            }

            await renderComponent({
                matchIndex: 0,
                saygData,
                noOfThrows: 3,
                noOfLegs: 2,
                showWinner: false,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(getRowContent(rows[1])).toEqual([
                '2', '90', '90', '90', '90', '15', '', '51', '0',
                '90', '100', '110', '120', '15', '81', '', '3',
            ]);
        });
    });
});