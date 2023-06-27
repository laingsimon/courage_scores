// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {MatchLogRow} from "./MatchLogRow";

describe('MatchLogRow', () => {
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
            (<MatchLogRow {...props} />),
            null,
            null,
            'tbody');
    }

    describe('renders', () => {
        const homeWinningLeg = {
            home: {
                throws: [
                    { score: 140, bust: false, noOfDarts: 3 },
                    { score: 60, bust: false, noOfDarts: 3 },
                    { score: 180, bust: false, noOfDarts: 3 },
                    { score: 20, bust: false, noOfDarts: 3 },
                    { score: 101, bust: false, noOfDarts: 2 },
                ],
            },
            away: {
                throws: [],
            },
            startingScore: 501,
        };

        it('null when no darts thrown', async () => {
             await renderComponent({
                 leg: {
                     home: {
                         throws: [],
                         noOfDarts: 0,
                     },
                     away: {
                         throws: [],
                         noOfDarts: 0,
                     },
                 },
                 legNo: 1,
                 accumulatorName: 'home',
                 player: 'PLAYER',
                 noOfThrows: 5,
                 playerOverallAverage: 12.34,
                 noOfLegs: 3,
                 showWinner: false,
                 teamAverage: 23.45,
             });

             expect(reportedError).toBeNull();
             expect(context.container.querySelector('tr')).toBeFalsy();
         });

        it('when a winner - first leg', async () => {
            await renderComponent({
                leg: homeWinningLeg,
                legNo: 1,
                accumulatorName: 'home',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: true,
                teamAverage: 23.45,
            });

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([ 'PLAYER', '1', '14', '101', '', '1', '1', '1', '4', '12.34', '23.45', '2', '140', '60', '180', '20', '101', '' ]);
            expect(context.container.querySelector('tr').className).toEqual('bg-winner');
        });

        it('when a winner - second leg', async () => {
            await renderComponent({
                leg: homeWinningLeg,
                legNo: 2,
                accumulatorName: 'home',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: false,
                teamAverage: 23.45,
            });

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([ '2', '14', '101', '', '1', '1', '1', '4', '2', '140', '60', '180', '20', '101', '' ]);
            expect(context.container.querySelector('tr').className).toEqual('');
        });

        it('when not a winner - first leg', async () => {
            await renderComponent({
                leg: homeWinningLeg,
                legNo: 1,
                accumulatorName: 'away',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: true,
                teamAverage: 23.45,
            });

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([ 'PLAYER', '1', '0', '', '', '0', '0', '0', '0', '12.34', '23.45', '', '', '', '', '', '', '' ]);
            expect(context.container.querySelector('tr').className).toEqual('');
        });

        it('when not a winner - second leg', async () => {
            await renderComponent({
                leg: homeWinningLeg,
                legNo: 2,
                accumulatorName: 'away',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: false,
                teamAverage: 23.45,
            });

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([ '2', '0', '', '', '0', '0', '0', '0', '', '', '', '', '', '', '' ]);
            expect(context.container.querySelector('tr').className).toEqual('');
        });
    });
});