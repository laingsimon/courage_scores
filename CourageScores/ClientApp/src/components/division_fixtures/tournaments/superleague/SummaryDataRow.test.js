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
    });
});