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

    it('logged out - renders given no saved data', async () => {
        await renderComponent(null, '');

        expect(reportedError).toBeFalsy();
        const inputs = context.container.querySelectorAll('input');
        expect(inputs.length).toEqual(5);
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeNull();
    });

    it('logged out - renders given empty saved data', async () => {
        await renderComponent(null, '#');

        expect(reportedError).toBeFalsy();
        const inputs = context.container.querySelectorAll('input');
        expect(inputs.length).toEqual(5);
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeNull();
    });

    it('logged out - renders given not-found data', async () => {
        const data = '#not-found';

        await renderComponent(null, data);

        expect(reportedError).toBeFalsy();
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).not.toBeNull();
        expect(dataError.querySelector('p').innerHTML).toEqual('Data not found');
    });

    it('logged out - renders given valid incomplete json data', async () => {
        const jsonData = {
            startingScore: 123,
            numberOfLegs: 2,
            legs: {
                '0': {}
            },
            homeScore: 1,
            yourName: 'you',
            opponentName: '',
            id: createTemporaryId(),
        };
        saygData[jsonData.id] = jsonData;

        await renderComponent(null, '#' + jsonData.id);

        expect(reportedError).toBeFalsy();
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeNull();
        const inputs = context.container.querySelectorAll('input');
        expect(inputs.length).toEqual(5); // the settings + score input
    });

    it('logged out - renders given valid completed json data', async () => {
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

        await renderComponent(null, '#' + jsonData.id);

        expect(reportedError).toBeFalsy();
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeNull();
        const matchStatistics = context.container.querySelector('h4');
        expect(matchStatistics).not.toBeNull();
        expect(matchStatistics.innerHTML).toEqual('Match statistics');
    });
});