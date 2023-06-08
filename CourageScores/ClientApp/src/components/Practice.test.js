// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton, doChange} from "../helpers/tests";
import React from "react";
import {Practice} from "./Practice";
import {createTemporaryId} from "../helpers/projection";

describe('Practice', () => {
    let context;
    let reportedError;
    let saygData;
    let shareData;
    let apiResultFunc;

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
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        saygData = {};
    });

    async function renderComponent(account, hash) {
        apiResultFunc = (data) => { return {
            result: data,
            success: true,
        } };
        reportedError = null;
        shareData = null;
        // noinspection JSValidateTypes
        navigator.share = (data) => shareData = data;
        context = await renderApp(
            { saygApi },
            {
                account: account,
                appLoading: false,
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
            await doClick(findButton(context.container, '🔗'));

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
            await doClick(findButton(context.container, '🔗'));

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

            doChange(context.container, 'input[name="yourName"]', 'YOU');

            await doClick(findButton(context.container, '🔗'));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].yourName).toEqual('YOU');
        });

        it('can clear opponent name', async () => {
            await renderComponent(account, '');
            expect(reportedError).toBeNull();
            assertNoDataError();
            doChange(context.container, 'input[name="opponentName"]', 'THEM');
            await doClick(findButton(context.container, '🔗'));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].opponentName).toEqual('THEM');

            doChange(context.container, 'input[name="opponentName"]', '');

            await doClick(findButton(context.container, '🔗'));
            expect(saygData[id].opponentName).toEqual('');
        });

        it('handles save error correctly', async () => {
            await renderComponent(account, '');
            expect(reportedError).toBeNull();
            assertNoDataError();
            apiResultFunc = (data) => {
                throw new Error('some error');
            };

            await doClick(findButton(context.container, '🔗'));

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

            await doClick(findButton(context.container, 'Start...'));

            await doClick(findButton(context.container, '🔗'));
            expect(saygData[jsonData.id].startingScore).toEqual(jsonData.startingScore);
            expect(saygData[jsonData.id].numberOfLegs).toEqual(jsonData.numberOfLegs);
            expect(saygData[jsonData.id].yourName).toEqual(jsonData.yourName);
            expect(saygData[jsonData.id].opponentName).toEqual(jsonData.opponentName);
            expect(saygData[jsonData.id].homeScore).toEqual(0);
            expect(saygData[jsonData.id].awayScore).toEqual(0);
            expect(Object.keys(saygData[jsonData.id].legs)).toEqual(['0']);
        });
    });

    describe('logged in', () => {
        const account = {
            givenName: 'GIVEN NAME',
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