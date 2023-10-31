// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, findButton, renderApp} from "../../../helpers/tests";
import {act} from "@testing-library/react";
import React from "react";
import {SaygLoadingContainer, useSayg} from "./SaygLoadingContainer";
import {any} from "../../../helpers/collections";
import {legBuilder, saygBuilder} from "../../../helpers/builders";

describe('SaygLoadingContainer', () => {
    let context;
    let reportedError;
    let oneEighty;
    let hiCheck;
    let changedScore;
    let saved;
    let loadError;
    let saygDataMap;
    let apiResponse;
    let upsertedData;
    let webSocket;
    let sentData;
    let webSocketClosed;

    const saygApi = {
        get: async (id) => {
            if (!any(Object.keys(saygDataMap), key => key === id)) {
                throw new Error('Unexpected request for sayg data');
            }

            return saygDataMap[id];
        },
        upsert: async (data) => {
            upsertedData = data;
            return apiResponse || {
                success: true,
                result: Object.assign({id: 'NEW_ID'}, data),
            };
        },
        createSocket: async (id) => {
            return (webSocket = {
                socketCreatedFor: id,
                send: (data) => {
                    sentData.push(data);
                },
                close: () => {
                    webSocketClosed = true;
                },
            });
        },
    }

    beforeEach(() => {
        saygDataMap = {};
        apiResponse = null;
        upsertedData = null;
        webSocket = null;
        webSocketClosed = false;
        sentData = [];
    })

    afterEach(() => {
        cleanUp(context);
    });

    async function on180(player) {
        oneEighty = player;
    }

    async function onHiCheck(player, score) {
        hiCheck = {player, score};
    }

    async function onScoreChange(homeScore, awayScore) {
        changedScore = {homeScore, awayScore};
    }

    async function onSaved(data) {
        saved = data;
    }

    async function onLoadError(error) {
        loadError = error;
    }

    async function renderComponent(props) {
        reportedError = null;
        oneEighty = null;
        hiCheck = null;
        changedScore = null;
        saved = null;
        loadError = null;
        context = await renderApp(
            {saygApi},
            {name: 'Courage Scores'},
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
                reportClientSideException: () => {
                },
            },
            <SaygLoadingContainer
                {...props}
                on180={on180}
                onHiCheck={onHiCheck}
                onScoreChange={onScoreChange}
                onSaved={onSaved}
                onLoadError={onLoadError}/>);
    }

    describe('loading and saving', () => {
        it('gets sayg data for given id', async () => {
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });

            expect(reportedError).toBeNull();
            expect(containerProps).toEqual({
                sayg: saygDataMap[saygData.id],
                saveDataAndGetId: expect.any(Function),
                enableLiveUpdates: expect.any(Function),
                setSayg: expect.any(Function),
            });
        });

        it('uses default data if given no id', async () => {
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: null,
                defaultData: {
                    legs: {
                        '0': {
                            startingScore: 501,
                        }
                    },
                },
                autoSave: false,
            });

            expect(reportedError).toBeNull();
            expect(containerProps).toEqual({
                sayg: {
                    legs: {
                        '0': {
                            startingScore: 501,
                        }
                    },
                },
                saveDataAndGetId: expect.any(Function),
                enableLiveUpdates: expect.any(Function),
                setSayg: expect.any(Function),
            });
        });

        it('reports load error if no sayg data returned', async () => {
            const id = 'NO_DATA_ID';
            saygDataMap[id] = null;
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: id,
                defaultData: null,
                autoSave: false,
            });

            expect(reportedError).toBeNull();
            expect(loadError).toEqual('Data not found');
        });

        it('reports load error if no legs in returned sayg data', async () => {
            const id = 'NO_LEGS_ID';
            saygDataMap[id] = {};
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: id,
                defaultData: null,
                autoSave: false,
            });

            expect(reportedError).toBeNull();
            expect(loadError).toEqual('Data not found');
        });

        it('sets lastUpdated in sayg data', async () => {
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .updated('2023-07-21')
                .addTo(saygDataMap)
                .build();
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });

            expect(reportedError).toBeNull();
            expect(containerProps.sayg.lastUpdated).toEqual('2023-07-21');
        });

        it('should be able to update sayg data', async () => {
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: null,
                defaultData: {
                    isDefault: true,
                    legs: {
                        '0': legBuilder().startingScore(501).build()
                    },
                },
                autoSave: false,
            });
            expect(containerProps.sayg.isDefault).toEqual(true);

            await act(() => {
                containerProps.setSayg({
                    legs: {
                        '0': {
                            startingScore: 501,
                        }
                    },
                    lastUpdated: '2023-07-21',
                });
            });

            expect(reportedError).toBeNull();
            expect(containerProps.sayg.lastUpdated).toEqual('2023-07-21');
        });

        it('should be able to save data and get id', async () => {
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: null,
                defaultData: {
                    legs: {
                        '0': legBuilder().startingScore(501).build()
                    },
                },
                autoSave: false,
            });
            let result;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).not.toBeNull();
            expect(result).toEqual('#' + saved.id);
            expect(containerProps.sayg).toEqual(saved);
        });

        it('should handle error during upsert', async () => {
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: null,
                defaultData: {
                    legs: {
                        '0': legBuilder().startingScore(501).build()
                    },
                },
                autoSave: false,
            });
            apiResponse = {success: false, errors: ['SOME ERROR']};
            let result;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).toBeNull();
            expect(result).toBeNull();
            expect(containerProps.sayg.id).toBeUndefined();
            expect(context.container.textContent).toContain('Could not save data');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('should be able to close error details after upsert failure', async () => {
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: null,
                defaultData: {
                    legs: {
                        '0': legBuilder().startingScore(501).build()
                    },
                },
                autoSave: false,
            });
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await act(async () => {
                await containerProps.saveDataAndGetId();
            });
            expect(context.container.textContent).toContain('Could not save data');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save data');
        });

        it('should handle exception during upsert', async () => {
            let containerProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => containerProps = data}/>),
                id: null,
                defaultData: {
                    legs: {
                        '0': legBuilder().startingScore(501).build()
                    },
                },
                autoSave: false,
            });
            apiResponse = {success: true, result: 'SOMETHING THAT WILL TRIGGER AN EXCEPTION'};
            let result;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).toBeNull();
            expect(result).toBeNull();
            expect(containerProps.sayg.id).toBeUndefined();
            expect(reportedError).not.toBeNull();
        });

        it('should save data when score changes and auto save enabled', async () => {
            await renderComponent({
                id: null,
                defaultData: {
                    homeScore: 0,
                    awayScore: 0,
                    startingScore: 501,
                    numberOfLegs: 3,
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .currentThrow('home')
                            .playerSequence('home', 'away')
                            .home(c => c.score(451))
                            .away(c => c.score(200).withThrow(0))
                            .build()
                    },
                },
                autoSave: true,
            });

            await doChange(context.container, 'input[data-score-input="true"]', '50', context.user);
            await doClick(findButton(context.container, '📌📌'));

            expect(upsertedData).not.toBeNull();
            expect(saved).not.toBeNull();
            expect(changedScore).toEqual({homeScore: 1, awayScore: 0});
        });

        it('should save data when player sequence changes and auto save enabled', async () => {
            await renderComponent({
                id: null,
                defaultData: {
                    homeScore: 0,
                    awayScore: 0,
                    startingScore: 501,
                    numberOfLegs: 3,
                    yourName: 'HOME',
                    opponentName: 'AWAY',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home(c => c.score(0))
                            .away(c => c.score(0))
                            .build()
                    },
                },
                autoSave: true,
            });

            await doClick(findButton(context.container, '🎯HOME'));

            expect(upsertedData).not.toBeNull();
            expect(saved).not.toBeNull();
        });

        it('should save data when player sequence changes and auto save enabled', async () => {
            await renderComponent({
                id: null,
                defaultData: {
                    homeScore: 0,
                    awayScore: 0,
                    startingScore: 501,
                    numberOfLegs: 3,
                    yourName: 'HOME',
                    opponentName: 'AWAY',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home(c => c.score(0))
                            .away(c => c.score(0))
                            .build()
                    },
                },
                autoSave: false,
            });

            await doClick(findButton(context.container, '🎯HOME'));

            expect(upsertedData).toBeNull();
            expect(saved).toBeNull();
        });

        it('should not save data when score changes and auto save disabled', async () => {
            await renderComponent({
                id: null,
                defaultData: {
                    homeScore: 0,
                    awayScore: 0,
                    startingScore: 501,
                    numberOfLegs: 3,
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .playerSequence('home', 'away')
                            .currentThrow('home')
                            .home(c => c.score(451))
                            .away(c => c.score(200).withThrow(0))
                            .build()
                    },
                },
                autoSave: false,
            });

            await doChange(context.container, 'input[data-score-input="true"]', '50', context.user);
            await doClick(findButton(context.container, '📌📌'));

            expect(upsertedData).toBeNull();
            expect(saved).toBeNull();
            expect(changedScore).toEqual({homeScore: 1, awayScore: 0});
        });
    });

    describe('live updates', () => {
        it('given sayg, when enabling, creates a socket', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });

            await act(async () => {
                await enableLiveUpdates(true);
            });

            expect(webSocket).not.toBeNull();
            expect(webSocket.socketCreatedFor).toEqual(saygData.id);
            expect(sentData.map(JSON.parse)).toEqual([{type:'marco'}]);
        });

        it('given non-message message type, does nothing', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });
            const messages = [];

            await act(async () => {
                console.log = (msg) => {
                    messages.push(msg);
                };

                await enableLiveUpdates(true);

                webSocket.onmessage({
                    type: 'unknown',
                    data: 'some data',
                });
            });

            expect(messages).toEqual(['Unhandled message: {"type":"unknown","data":"some data"}']);
        });

        it('given unknown live message type, does nothing', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });
            const messages = [];

            await act(async () => {
                console.log = (msg) => {
                    messages.push(msg);
                };

                await enableLiveUpdates(true);

                webSocket.onmessage({
                    type: 'message',
                    data: JSON.stringify({
                        type: 'UNKNOWN',
                        data: saygData,
                    }),
                });
            });

            expect(messages.length).toEqual(1);
            expect(messages[0]).toContain('Unhandled message: {"type":"UNKNOWN","data":{');
        });

        it('given polo live message type, does nothing', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });

            await act(async () => {
                await enableLiveUpdates(true);

                webSocket.onmessage({
                    type: 'message',
                    data: JSON.stringify({
                        type: 'Polo',
                    }),
                });
            });

            expect(sentData.map(JSON.parse)).toEqual([{type:'marco'}]);
        });

        it('given marco live message type, sends polo', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });

            await act(async () => {
                await enableLiveUpdates(true);

                webSocket.onmessage({
                    type: 'message',
                    data: JSON.stringify({
                        type: 'Marco',
                    }),
                    currentTarget: webSocket,
                });
            });

            expect(sentData.map(JSON.parse)).toEqual([
                {type:'marco'},
                {type:'polo'},
            ]);
        });

        it('given error live message type, shows error', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });

            await act(async () => {
                console.error = () => {};

                await enableLiveUpdates(true);

                webSocket.onmessage({
                    type: 'message',
                    data: JSON.stringify({
                        type: 'Error',
                        message: 'Some error message',
                    }),
                });
            });

            expect(reportedError).toEqual('Some error message');
        });

        it('given update live message type, updates sayg data', async () => {
            let enableLiveUpdates;
            let renderedData;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            const newSaygData = saygBuilder(saygData.id)
                .withLeg('0', l => l.startingScore(601))
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                    renderedData = data.sayg;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });
            expect(renderedData).toEqual(saygData);

            await act(async () => {
                await enableLiveUpdates(true);

                webSocket.onmessage({
                    type: 'message',
                    data: JSON.stringify({
                        type: 'Update',
                        data: newSaygData,
                    }),
                });
            });

            expect(reportedError).toBeNull();
            expect(sentData.map(JSON.parse)).toEqual([{type:'marco'}]);
            expect(renderedData).toEqual(newSaygData);
        });

        it('given no socket, when disabling, does nothing', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });

            await act(async () => {
                await enableLiveUpdates(false);
            });

            expect(webSocket).toBeNull(); // no socket should be created
        });

        it('given an open socket, when disabling, closes socket', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });
            await act(async () => {
                await enableLiveUpdates(true);
            });

            await act(async () => {
                // now close the socket
                await enableLiveUpdates(false);
            });

            expect(webSocket).not.toBeNull();
            expect(webSocketClosed).toEqual(true);
        });

        it('given an open socket, handles server side closure', async () => {
            let enableLiveUpdates;
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
            });
            await act(async () => {
                await enableLiveUpdates(true);
            });

            await act(async () => {
                console.error = () => {};

                webSocket.onclose();
            });

            // expect no error
        });
    });

    function TestComponent({onLoaded}) {
        const {sayg, setSayg, saveDataAndGetId, enableLiveUpdates} = useSayg();

        onLoaded({sayg, setSayg, saveDataAndGetId, enableLiveUpdates});

        return (<div>Loaded</div>)
    }
});