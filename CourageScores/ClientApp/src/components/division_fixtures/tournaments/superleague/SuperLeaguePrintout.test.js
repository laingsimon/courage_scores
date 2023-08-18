// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {SuperLeaguePrintout} from "./SuperLeaguePrintout";
import {TournamentContainer} from "../TournamentContainer";
import {createTemporaryId} from "../../../../helpers/projection";

describe('SuperLeaguePrintout', () => {
    let context;
    let reportedError;
    let saygApiResponseMap = {};

    const saygApi = {
        get: async (id) => {
            const data = saygApiResponseMap[id];
            if (data) {
                return data;
            }

            throw new Error('Unexpected request for sayg data: ' + id);
        }
    };

    afterEach(() => {
        saygApiResponseMap = {};
        cleanUp(context);
    });

    async function renderComponent(tournamentData, division) {
        reportedError = null;
        context = await renderApp(
            {saygApi},
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
            (<TournamentContainer tournamentData={tournamentData}>
                <SuperLeaguePrintout division={division}/>
            </TournamentContainer>));
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
        it('print out', async () => {
            const match1 = {
                id: createTemporaryId(),
                saygId: createTemporaryId(),
                sideA: {name: 'A'},
                sideB: {name: 'B'},
                scoreA: 1,
                scoreB: 2,
            };
            const match2 = {
                id: createTemporaryId(),
                saygId: createTemporaryId(),
                sideA: {name: 'C'},
                sideB: {name: 'D'},
                scoreA: 3,
                scoreB: 4,
            };
            const saygData1 = {
                legs: {
                    '0': createLeg(true, false),
                    '1': createLeg(true, false),
                }
            };
            const saygData2 = {
                legs: {
                    '0': createLeg(false, true),
                    '1': createLeg(false, true),
                }
            };
            const tournamentData = {
                round: {
                    matches: [match1, match2],
                }
            };
            const division = {
                id: createTemporaryId(),
                name: 'DIVISION',
            };
            saygApiResponseMap = {};
            saygApiResponseMap[match1.saygId] = saygData1;
            saygApiResponseMap[match2.saygId] = saygData2;

            await renderComponent(tournamentData, division);

            expect(reportedError).toBeNull();
            const headings = Array.from(context.container.querySelectorAll('h2'));
            expect(headings.map(h => h.textContent)).toEqual([
                'Master draw', 'Match log', 'Summary', 'SOMERSET DARTS ORGANISATION'
            ]);
        });
    });
});