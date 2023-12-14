// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, findButton, renderApp} from "../helpers/tests";
import React from "react";
import {Practice} from "./Practice";
import {createTemporaryId} from "../helpers/projection";

describe('Practice', () => {
    let context;
    let reportedError;
    let saygData;
    let shareData;
    let apiResultFunc;
    let socketCreatedFor;
    let sentData;

    const saygApi = {
        get: async (id) => {
            return saygData[id];
        },
        upsert: (data) => {
            if (!data.id) {
                data.id = createTemporaryId();
            }
            saygData[data.id] = data;
            return apiResultFunc(data);
        },
        delete: (id) => {
            delete saygData[id];
            return {
                success: true,
            }
        },
    };

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        saygData = {};
        socketCreatedFor = null;
        sentData = [];
    });

    async function renderComponent(account, hash, appLoading) {
        apiResultFunc = (data) => {
            return {
                result: data,
                success: true,
            }
        };
        reportedError = null;
        shareData = null;
        // noinspection JSValidateTypes
        navigator.share = (data) => shareData = data;
        context = await renderApp(
            {saygApi},
            {name: 'Courage Scores'},
            {
                account: account,
                appLoading: appLoading || false,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<Practice/>),
            '/practice',
            '/practice' + hash);
    }

    function assertNoDataError() {
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeFalsy();
    }

    function assertDataError(error) {
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeTruthy();
        expect(dataError.textContent).toContain(error);
    }

    function assertInputValue(name, value) {
        const input = context.container.querySelector(`input[name="${name}"]`);
        expect(input).toBeTruthy();
        expect(input.value).toEqual(value);
    }

    function assertScoreInputVisible() {
        const scoreInput = context.container.querySelector('input[data-score-input="true"]');
        expect(scoreInput).toBeTruthy();
    }

    describe('logged out', () => {
        const account = null;

        it('renders when app is loading', async () => {
            await renderComponent(account, '', true);

            expect(reportedError).toBeNull();
            assertNoDataError();
            expect(context.container.querySelector('.loading-background')).not.toBeNull();
        });

        it('renders given no saved data', async () => {
            await renderComponent(account, '');

            expect(reportedError).toBeNull();
            assertNoDataError();
            assertInputValue('yourName', 'you');
            assertInputValue('startingScore', '501');
            assertInputValue('numberOfLegs', '3');
            assertInputValue('opponentName', '');
            assertScoreInputVisible();
        });

        it('renders given empty saved data', async () => {
            await renderComponent(account, '#');

            expect(reportedError).toBeNull();
            assertNoDataError();
            assertInputValue('yourName', 'you');
            assertInputValue('startingScore', '501');
            assertInputValue('numberOfLegs', '3');
            assertInputValue('opponentName', '');
            assertScoreInputVisible();
        });

        it('renders given not-found data', async () => {
            const data = '#not-found';

            await renderComponent(account, data);

            expect(reportedError).toBeNull();
            assertDataError('Data not found');
        });

        it('can close data error', async () => {
            const data = '#not-found';
            await renderComponent(account, data);
            expect(reportedError).toBeNull();
            assertDataError('Data not found');

            await doClick(findButton(context.container.querySelector('div[data-name="data-error"]'), 'Clear'));

            assertNoDataError();
        });

        it('renders given valid unfinished json data', async () => {
            const jsonData = {
                startingScore: 123,
                numberOfLegs: 2,
                legs: {
                    '0': {}
                },
                homeScore: 1,
                yourName: 'Simon',
                opponentName: '',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;

            await renderComponent(account, '#' + jsonData.id);

            expect(reportedError).toBeNull();
            assertNoDataError();
            assertInputValue('yourName', 'Simon');
            assertInputValue('startingScore', '123');
            assertInputValue('numberOfLegs', '2');
            assertInputValue('opponentName', '');
            assertScoreInputVisible();
        });

        it('renders given valid finished json data', async () => {
            const jsonData = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;

            await renderComponent(account, '#' + jsonData.id);

            expect(reportedError).toBeNull();
            assertNoDataError();
            assertInputValue('yourName', 'you');
            assertInputValue('startingScore', '123');
            assertInputValue('numberOfLegs', '1');
            assertInputValue('opponentName', 'them');
            const matchStatistics = context.container.querySelector('h4');
            expect(matchStatistics).toBeTruthy();
            expect(matchStatistics.textContent).toEqual('Match statistics');
        });

        it('can save unfinished practice data', async () => {
            const jsonData = {
                startingScore: 123,
                numberOfLegs: 2,
                legs: {
                    '0': {}
                },
                homeScore: 1,
                yourName: 'Simon',
                opponentName: '',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;
            await renderComponent(account, '#' + jsonData.id);
            expect(reportedError).toBeNull();
            assertNoDataError();

            delete saygData[jsonData.id];
            await doClick(findButton(context.container, 'Save '));

            expect(Object.keys(saygData)).toContain(jsonData.id);
            expect(shareData).toEqual({
                text: 'Practice',
                title: 'Practice',
                url: `/practice#${jsonData.id}`
            });
        });

        it('can save finished practice data', async () => {
            const jsonData = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;
            await renderComponent(account, '#' + jsonData.id);
            expect(reportedError).toBeNull();
            assertNoDataError();

            delete saygData[jsonData.id];
            await doClick(findButton(context.container, 'Save '));

            expect(Object.keys(saygData)).toContain(jsonData.id);
            expect(shareData).toEqual({
                text: 'Practice',
                title: 'Practice',
                url: `/practice#${jsonData.id}`
            });
        });

        it('can change your name', async () => {
            await renderComponent(account, '');
            expect(reportedError).toBeNull();
            assertNoDataError();

            await doChange(context.container, 'input[name="yourName"]', 'YOU', context.user);

            await doClick(findButton(context.container, 'Save '));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].yourName).toEqual('YOU');
        });

        it('can clear opponent name', async () => {
            await renderComponent(account, '');
            expect(reportedError).toBeNull();
            assertNoDataError();
            await doChange(context.container, 'input[name="opponentName"]', 'THEM', context.user);
            await doClick(findButton(context.container, 'Save '));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].opponentName).toEqual('THEM');

            await doChange(context.container, 'input[name="opponentName"]', '', context.user);

            await doClick(findButton(context.container, 'Save '));
            expect(saygData[id].opponentName).toEqual('');
        });

        it('handles save error correctly', async () => {
            await renderComponent(account, '');
            expect(reportedError).toBeNull();
            assertNoDataError();
            apiResultFunc = () => {
                throw new Error('some error');
            };

            await doClick(findButton(context.container, 'Save '));

            expect(reportedError).not.toBeNull();
        });

        it('can restart practice', async () => {
            const jsonData = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;
            await renderComponent(account, '#' + jsonData.id);
            expect(reportedError).toBeNull();
            assertNoDataError();

            await doClick(findButton(context.container, 'Restart...'));

            await doClick(findButton(context.container, 'Save '));
            expect(saygData[jsonData.id].startingScore).toEqual(jsonData.startingScore);
            expect(saygData[jsonData.id].numberOfLegs).toEqual(jsonData.numberOfLegs);
            expect(saygData[jsonData.id].yourName).toEqual(jsonData.yourName);
            expect(saygData[jsonData.id].opponentName).toEqual(jsonData.opponentName);
            expect(saygData[jsonData.id].homeScore).toEqual(0);
            expect(saygData[jsonData.id].awayScore).toEqual(0);
            expect(Object.keys(saygData[jsonData.id].legs)).toEqual(['0']);
        });

        it('can record scores as they are entered', async () => {
            await renderComponent(account, '');
            expect(reportedError).toBeNull();
            assertNoDataError();

            await doChange(context.container, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container, '📌📌📌'));

            await doClick(findButton(context.container, 'Save '));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].legs['0'].home).toEqual({
                noOfDarts: 3,
                score: 180,
                bust: false,
                throws: [{
                    bust: false,
                    noOfDarts: 3,
                    score: 180,
                }],
            });
        });

        it('can complete a leg', async () => {
            await renderComponent(account, '');
            expect(reportedError).toBeNull();
            assertNoDataError();
            await doChange(context.container, 'input[name="startingScore"]', '501', context.user);
            await doChange(context.container, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container, '📌📌📌')); // 321 left
            await doChange(context.container, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container, '📌📌📌')); // 141 left
            await doChange(context.container, 'input[data-score-input="true"]', '141', context.user);
            await doClick(findButton(context.container, '📌📌📌')); // checkout

            await doClick(findButton(context.container, 'Save '));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].homeScore).toEqual(1);
            expect(saygData[id].awayScore).toEqual(0);
        });
    });

    describe('logged in', () => {
        const account = {
            givenName: 'GIVEN NAME',
            access: {
                useWebSockets: false,
            },
        };

        it('when no data loaded, sets your name to account givenName', async () => {
            await renderComponent(account, '');

            expect(reportedError).toBeNull();
            assertInputValue('yourName', 'GIVEN NAME');
            assertScoreInputVisible();
        });

        it('renders given valid unfinished json data', async () => {
            const jsonData = {
                startingScore: 123,
                numberOfLegs: 2,
                legs: {
                    '0': {}
                },
                homeScore: 1,
                yourName: 'Simon',
                opponentName: '',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;

            await renderComponent(account, '#' + jsonData.id);

            expect(reportedError).toBeNull();
            assertNoDataError();
            assertInputValue('yourName', 'Simon');
            assertInputValue('startingScore', '123');
            assertInputValue('numberOfLegs', '2');
            assertInputValue('opponentName', '');
            assertScoreInputVisible();
        });

        it('renders given valid completed json data', async () => {
            const jsonData = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;

            await renderComponent(account, '#' + jsonData.id);

            expect(reportedError).toBeNull();
            assertNoDataError();
            assertInputValue('yourName', 'you');
            assertInputValue('startingScore', '123');
            assertInputValue('numberOfLegs', '1');
            assertInputValue('opponentName', 'them');
            const matchStatistics = context.container.querySelector('h4');
            expect(matchStatistics).toBeTruthy();
            expect(matchStatistics.textContent).toEqual('Match statistics');
        });
    });
});