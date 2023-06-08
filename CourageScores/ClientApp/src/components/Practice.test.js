// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../helpers/tests";
import React from "react";
import {Practice} from "./Practice";
import {createTemporaryId} from "../helpers/projection";

describe('Practice', () => {
    let context;
    let reportedError;
    let saygApi;
    let saygData;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        saygData = {};
        saygApi = {
            get: async (id) => {
                return saygData[id];
            },
            upsert: (data, lastUpdated) => {
                saygData[data.id] = { data, lastUpdated };
                return {
                    result: saygData[data.id],
                    success: true,
                };
            },
            delete: (id) => {
                delete saygData[id];
                return {
                    success: true,
                }
            }
        }
    });

    async function renderComponent(account, hash) {
        reportedError = null;
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
            const inputs = context.container.querySelectorAll('input');
            expect(inputs.length).toEqual(5);
            assertNoDataError();
        });

        it('renders given empty saved data', async () => {
            await renderComponent(account, '#');

            expect(reportedError).toBeNull();
            const inputs = context.container.querySelectorAll('input');
            expect(inputs.length).toEqual(5);
            assertNoDataError();
        });

        it('renders given not-found data', async () => {
            const data = '#not-found';

            await renderComponent(account, data);

            expect(reportedError).toBeNull();
            assertDataError('Data not found');
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