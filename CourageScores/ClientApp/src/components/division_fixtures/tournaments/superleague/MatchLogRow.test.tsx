// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {MatchLogRow} from "./MatchLogRow";
import {legBuilder} from "../../../../helpers/builders";

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
            (<MatchLogRow {...props} />),
            null,
            null,
            'tbody');
    }

    describe('renders', () => {
        const homeWinningLeg = legBuilder()
            .home(c => c
                .withThrow(140, false, 3)
                .withThrow(60, false, 3)
                .withThrow(180, false, 3)
                .withThrow(20, false, 3)
                .withThrow(101, false, 2)
                .noOfDarts(14))
            .away(c => c.noOfDarts(1))
            .startingScore(501)
            .build();

        it('null when no darts thrown', async () => {
            await renderComponent({
                leg: legBuilder().home(c => c.noOfDarts(0)).away(c => c.noOfDarts(0)).build(),
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
            expect(cells.map(td => td.textContent)).toEqual(['PLAYER', '1', '14', '101', '', '1', '1', '1', '4', '12.34', '23.45', '2', '140', '60', '180', '20', '101', '']);
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
            expect(cells.map(td => td.textContent)).toEqual(['2', '14', '101', '', '1', '1', '1', '4', '2', '140', '60', '180', '20', '101', '']);
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
            expect(cells.map(td => td.textContent)).toEqual(['PLAYER', '1', '0', '', '', '0', '0', '0', '0', '12.34', '23.45', '', '', '', '', '', '', '']);
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
            expect(cells.map(td => td.textContent)).toEqual(['2', '0', '', '', '0', '0', '0', '0', '', '', '', '', '', '', '']);
            expect(context.container.querySelector('tr').className).toEqual('');
        });
    });
});