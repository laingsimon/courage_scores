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
    }

    beforeEach(() => {
        saygDataMap = {};
        apiResponse = null;
        upsertedData = null;
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
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
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

    it('gets sayg data for given id', async () => {
        const saygData = saygBuilder()
            .withLeg('0', l => l.startingScore(501))
            .addTo(saygDataMap)
            .build();
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
            id: saygData.id,
            defaultData: null,
            autoSave: false,
        });

        expect(reportedError).toBeNull();
        expect(loadedWithData).toEqual({
            sayg: saygDataMap[saygData.id],
            saveDataAndGetId: expect.any(Function),
            setSayg: expect.any(Function)
        });
    });

    it('uses default data if given no id', async () => {
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
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
        expect(loadedWithData).toEqual({
            sayg: {
                legs: {
                    '0': {
                        startingScore: 501,
                    }
                },
            },
            saveDataAndGetId: expect.any(Function),
            setSayg: expect.any(Function)
        });
    });

    it('reports load error if no sayg data returned', async () => {
        const id = 'NO_DATA_ID';
        saygDataMap[id] = null;
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
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
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
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
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
            id: saygData.id,
            defaultData: null,
            autoSave: false,
        });

        expect(reportedError).toBeNull();
        expect(loadedWithData.sayg.lastUpdated).toEqual('2023-07-21');
    });

    it('should be able to update sayg data', async () => {
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
            id: null,
            defaultData: {
                isDefault: true,
                legs: {
                    '0': legBuilder().startingScore(501).build()
                },
            },
            autoSave: false,
        });
        expect(loadedWithData.sayg.isDefault).toEqual(true);

        await act(() => {
            loadedWithData.setSayg({
                legs: {
                    '0': {
                        startingScore: 501,
                    }
                },
                lastUpdated: '2023-07-21',
            });
        });

        expect(reportedError).toBeNull();
        expect(loadedWithData.sayg.lastUpdated).toEqual('2023-07-21');
    });

    it('should be able to save data and get id', async () => {
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
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
            result = await loadedWithData.saveDataAndGetId();
        });

        expect(saved).not.toBeNull();
        expect(result).toEqual('#' + saved.id);
        expect(loadedWithData.sayg).toEqual(saved);
    });

    it('should handle error during upsert', async () => {
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
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
            result = await loadedWithData.saveDataAndGetId();
        });

        expect(saved).toBeNull();
        expect(result).toBeNull();
        expect(loadedWithData.sayg.id).toBeUndefined();
        expect(context.container.textContent).toContain('Could not save data');
        expect(context.container.textContent).toContain('SOME ERROR');
    });

    it('should be able to close error details after upsert failure', async () => {
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
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
            await loadedWithData.saveDataAndGetId();
        });
        expect(context.container.textContent).toContain('Could not save data');

        await doClick(findButton(context.container, 'Close'));

        expect(context.container.textContent).not.toContain('Could not save data');
    });

    it('should handle exception during upsert', async () => {
        let loadedWithData;
        await renderComponent({
            children: (<TestComponent onLoaded={(data) => loadedWithData = data}/>),
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
            result = await loadedWithData.saveDataAndGetId();
        });

        expect(saved).toBeNull();
        expect(result).toBeNull();
        expect(loadedWithData.sayg.id).toBeUndefined();
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

    function TestComponent({onLoaded}) {
        const {sayg, setSayg, saveDataAndGetId} = useSayg();

        onLoaded({sayg, setSayg, saveDataAndGetId});

        return (<div>Loaded</div>)
    }
});