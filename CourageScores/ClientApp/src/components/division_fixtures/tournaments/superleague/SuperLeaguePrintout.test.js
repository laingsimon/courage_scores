// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {SuperLeaguePrintout} from "./SuperLeaguePrintout";
import {TournamentContainer} from "../TournamentContainer";
import {createTemporaryId} from "../../../../helpers/projection";
import {
    divisionBuilder,
    legBuilder,
    saygBuilder,
    tournamentBuilder,
    tournamentMatchBuilder
} from "../../../../helpers/builders";

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
        function winningThrows(c) {
            return c
                .withThrow(90, false, 3)
                .withThrow(100, false, 3)
                .withThrow(110, false, 3)
                .withThrow(120, false, 3)
                .withThrow(81, false, 3);
        }

        function notWinningThrows(c) {
            return c
                .withThrow(90, false, 3)
                .withThrow(90, false, 3)
                .withThrow(90, false, 3)
                .withThrow(90, false, 3)
                .withThrow(90, false, 3);
        }

        return legBuilder()
            .home(c => homeWinner ? winningThrows(c) : notWinningThrows(c))
            .away(c => awayWinner ? winningThrows(c) : notWinningThrows(c))
            .startingScore(501)
            .build();
    }

    describe('renders', () => {
        it('print out', async () => {
            const saygData1 = saygBuilder()
                .withLeg('0', createLeg(true, false))
                .withLeg('1', createLeg(true, false))
                .build();
            const saygData2 = saygBuilder()
                .withLeg('0', createLeg(false, true))
                .withLeg('1', createLeg(false, true))
                .build();
            const tournamentData = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m.saygId(saygData1.id)
                        .sideA('A', 1)
                        .sideB('B', 2))
                    .withMatch(m => m.saygId(saygData2.id)
                        .sideA('C', 3)
                        .sideB('D', 4)))
                .build();
            const division = divisionBuilder('DIVISION').build();
            saygApiResponseMap = {};
            saygApiResponseMap[saygData1.id] = saygData1;
            saygApiResponseMap[saygData2.id] = saygData2;

            await renderComponent(tournamentData, division);

            expect(reportedError).toBeNull();
            const headings = Array.from(context.container.querySelectorAll('h2'));
            expect(headings.map(h => h.textContent)).toEqual([
                'Master draw', 'Match log', 'Summary', 'SOMERSET DARTS ORGANISATION'
            ]);
        });
    });
});