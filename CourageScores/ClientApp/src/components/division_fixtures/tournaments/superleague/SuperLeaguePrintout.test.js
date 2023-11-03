// noinspection JSUnresolvedFunction

import {cleanUp, doSelectOption, renderApp} from "../../../../helpers/tests";
import React, {useState} from "react";
import {SuperLeaguePrintout} from "./SuperLeaguePrintout";
import {TournamentContainer} from "../TournamentContainer";
import {
    divisionBuilder,
    legBuilder,
    saygBuilder,
    tournamentBuilder,
} from "../../../../helpers/builders";
import {useLive} from "../../LiveContainer";
import {toDictionary} from "../../../../helpers/collections";
import {act} from "@testing-library/react";

describe('SuperLeaguePrintout', () => {
    let context;
    let reportedError;
    let saygApiResponseMap = {};
    let sockets;
    let changedSocket;
    let liveContext;

    const saygApi = {
        get: async (id) => {
            const data = saygApiResponseMap[id];
            if (data) {
                return data;
            }

            throw new Error('Unexpected request for sayg data: ' + id);
        }
    };
    const liveApi = {
        createSocket: async (id) => {
            const newSocket = {
                sent: [],
                createdFor: id,
                state: 'open',
            };
            newSocket.send = (data) => {
                newSocket.sent.push(data);
            };
            newSocket.close = () => {
                newSocket.state = 'closed';
            };
            sockets.push(newSocket);
            return newSocket;
        },
    };

    afterEach(() => {
        saygApiResponseMap = {};
        cleanUp(context);
    });

    async function renderComponent(tournamentData, division, webSocket) {
        reportedError = null;
        sockets = [];
        changedSocket = null;
        liveContext = {};
        context = await renderApp(
            {saygApi, liveApi},
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
            (<StatefulSocketComponent
                initialSocket={webSocket}
                tournamentData={tournamentData}
                setWebSocket={value => changedSocket = value}
                division={division}
                liveContext={liveContext} />));
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

                expect(sockets.map(s => s.createdFor)).toEqual([ tournamentData.id, saygData1.id, saygData2.id ]);
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
                const socketMap = toDictionary(sockets, s => s.createdFor);
                const newSaygData = saygBuilder(saygData1.id)
                    .withLeg('0', createLeg(true, false))
                    .withLeg('1', createLeg(true, false))
                    .withLeg('2', createLeg(false, true))
                    .build();
                await act(async () => {
                    socketMap[saygData1.id].updateHandler(newSaygData);
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

                expect(sockets.map(s => s.state)).toEqual([ 'closed', 'closed', 'closed' ]);
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
                expect(sockets.map(s => s.state)).toEqual([ 'closed', 'closed', 'closed' ]);

                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

                expect(sockets.map(s => s.state)).toEqual([ 'closed', 'closed', 'closed', 'open', 'open', 'open' ]);
            });
        });
    });

    function TestComponent({liveContext}) {
        const {isEnabled, enableLiveUpdates} = useLive();
        liveContext.isEnabled = isEnabled;
        liveContext.enableLiveUpdates = enableLiveUpdates;
    }

    function StatefulSocketComponent({initialSocket, tournamentData, setWebSocket, division, liveContext}) {
        const [socket, setSocket] = useState(initialSocket);

        function changeSocket(value) {
            setSocket(value);
            setWebSocket(value);
        }

        return <TournamentContainer tournamentData={tournamentData} webSocket={socket} setWebSocket={changeSocket}>
            <SuperLeaguePrintout division={division}/>
            <TestComponent liveContext={liveContext} />
        </TournamentContainer>;
    }
});