// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {SummaryDataRow} from "./SummaryDataRow";

describe('SummaryDataRow', () => {
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
            (<SummaryDataRow {...props} />),
            null,
            null,
            'tbody');
    }

    function getRowContent(row, tagName) {
        return Array.from(row.querySelectorAll(tagName)).map(th => th.textContent);
    }

    function createLeg(homeWinner, awayWinner) {
        const winningThrows = [
            {score: 90, bust: false, noOfDarts: 3},
            {score: 100, bust: false, noOfDarts: 3},
            {score: 110, bust: false, noOfDarts: 3},
            {score: 120, bust: false, noOfDarts: 3},
            {score: 81, bust: false, noOfDarts: 3},
        ];
        const notWinningThrows = [
            {score: 90, bust: false, noOfDarts: 3},
            {score: 90, bust: false, noOfDarts: 3},
            {score: 90, bust: false, noOfDarts: 3},
            {score: 90, bust: false, noOfDarts: 3},
            {score: 90, bust: false, noOfDarts: 3},
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
        it('match data', async () => {
            const saygData = {
                legs: {
                    '0': createLeg(true, false),
                    '1': createLeg(true, false),
                }
            };

            await renderComponent({
                matchNo: 1,
                saygData,
                showWinner: false,
                hostScore: 2,
                opponentScore: 3,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const row = context.container.querySelector('tr');
            expect(getRowContent(row, 'td')).toEqual([
                '1', 'HOST', '2', '6', '6', '0', '0', '33.4',
                'OPPONENT', '3', '0', '0', '0', '0', '30',
            ]);
        });

        it('host winner', async () => {
            const saygData = {
                legs: {
                    '0': createLeg(true, false),
                    '1': createLeg(true, false),
                }
            };

            await renderComponent({
                matchNo: 1,
                saygData,
                showWinner: true,
                hostScore: 3,
                opponentScore: 2,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const row = context.container.querySelector('tr');
            const cells = Array.from(row.querySelectorAll('td'));
            expect(cells[1].className).toEqual('bg-winner');
            expect(cells[8].className).toEqual('');
        });

        it('opponent winner', async () => {
            const saygData = {
                legs: {
                    '0': createLeg(false, true),
                    '1': createLeg(false, true),
                }
            };

            await renderComponent({
                matchNo: 1,
                saygData,
                showWinner: true,
                hostScore: 2,
                opponentScore: 3,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError).toBeNull();
            const row = context.container.querySelector('tr');
            const cells = Array.from(row.querySelectorAll('td'));
            expect(cells[1].className).toEqual('');
            expect(cells[8].className).toEqual('bg-winner');
        });
    });
});