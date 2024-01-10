// noinspection JSUnresolvedFunction

import {cleanUp, doSelectOption, renderApp} from "../../../../helpers/tests";
import React from "react";
import {SuperLeaguePrintout} from "./SuperLeaguePrintout";
import {TournamentContainer} from "../TournamentContainer";
import {
    divisionBuilder,
    legBuilder,
    saygBuilder,
    tournamentBuilder,
} from "../../../../helpers/builders";
import {act} from "@testing-library/react";

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
        saygApiResponseMap = {};
        cleanUp(context);
    });

    async function renderComponent(tournamentData, division) {
        reportedError = null;
        webSocket.socket = null;
        webSocket.subscriptions = {};
        webSocket.sent = [];
        context = await renderApp(
            {
                saygApi,
                socketFactory: webSocket.socketFactory,
            },
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
                account: {
                    access: {
                        useWebSockets: true,
                    },
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

    describe('interactivity', () => {
        describe('live updates', () => {
            it('can start live updates', async () => {
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

                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

                expect(Object.keys(webSocket.subscriptions).sort()).toEqual([ saygData1.id, saygData2.id, tournamentData.id ].sort());
            });

            it('can handle live updates', async () => {
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
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');
                expect(context.container.querySelector('div[datatype="match-report"] > div > div:nth-child(1)').textContent).toEqual('Legs won: 2');
                expect(context.container.querySelector('div[datatype="match-report"] > div > div:nth-child(2)').textContent).toEqual('Legs won: 2');

                //send through some data
                const newSaygData = saygBuilder(saygData1.id)
                    .withLeg('0', createLeg(true, false))
                    .withLeg('1', createLeg(true, false))
                    .withLeg('2', createLeg(false, true))
                    .build();
                await act(async () => {
                    webSocket.socket.onmessage({
                        type: 'message',
                        data: JSON.stringify({
                            type: 'Update',
                            id: newSaygData.id,
                            data: newSaygData
                        }),
                    });
                });

                expect(context.container.querySelector('div[datatype="match-report"] > div > div:nth-child(1)').textContent).toEqual('Legs won: 2');
                expect(context.container.querySelector('div[datatype="match-report"] > div > div:nth-child(2)').textContent).toEqual('Legs won: 3');
            });

            it('can stop live updates', async () => {
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
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

                await doSelectOption(context.container.querySelector('.dropdown-menu'), '⏸️ Paused');

                expect(Object.keys(webSocket.subscriptions)).toEqual([]);
            });

            it('can stop then restart live updates', async () => {
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
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '⏸️ Paused');
                expect(Object.keys(webSocket.subscriptions)).toEqual([]);

                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

                expect(Object.keys(webSocket.subscriptions).sort()).toEqual([ tournamentData.id, saygData1.id, saygData2.id ].sort());
            });
        });
    });
});