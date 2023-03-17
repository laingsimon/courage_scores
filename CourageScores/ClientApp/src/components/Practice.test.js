// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../tests/helpers";
import React from "react";
import {Practice} from "./Practice";

describe('Practice', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(account, hash) {
        reportedError = null;
        context = await renderApp(
            {},
            {
                account: account, appLoading: false, onError: (err) => {
                    reportedError = err;
                }
            },
            (<Practice/>),
            '/practice',
            '/practice' + hash);
    }

    it('logged out - renders given no saved data', async () => {
        await renderComponent(null, '');

        expect(reportedError).toBeFalsy();
        const inputs = context.container.querySelectorAll('input');
        expect(inputs.length).toBe(4);
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeNull();
    });

    it('logged out - renders given empty saved data', async () => {
        await renderComponent(null, '#');

        expect(reportedError).toBeFalsy();
        const inputs = context.container.querySelectorAll('input');
        expect(inputs.length).toBe(4);
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeNull();
    });

    it('logged out - renders given corrupt json data', async () => {
        const data = '#eyJzdGFydGluZ1Njb3JlIjo1MDEsIm51bWJlck9mTGVncyI6MywiaG9tZVNjb3JlIjozLCJhd2F5U2NvcmUiOjAsImRhdGEiOnsibGVncyI6eyIwIjp7InBsYXllclNlcXVlbmNlIjpbeyJ2YWx1ZSI6ImhvbWUiLCJ0ZXh0IjoieW91In0seyJ2YWx1ZSI6ImF3YXkiLCJ0ZXh0IjoidW51c2VkLXNpbmdsZS1wbGF5ZXIifV0sImhvbWUiOnsidGhyb3dzIjpbeyJzY29yZSI6NjYsIm5vT2ZEYXJ0cyI6M30seyJzY29yZSI6MzIsIm5vT2ZEYXJ0cyI6M30seyJzY29yZSI6NTMsIm5vT2ZEYXJ0cyI6M30seyJzY29yZSI6MSwibm9PZkRhcnRzIjozfSx7InNjb3JlIjozNiwibm9PZkRhcnRzIjozfSx7InNjb3JlIjoxOCwibm9PZkRhcnRzIjozfSx7InNjb3JlIjo0NSwibm9PZkRhcnRzIjozfSx7InNjb3JlIjoyMSwibm9PZkRhcnRzIjozfSx7InNjb3JlIjo1LCJub09mRGFydHMiOjN9LHsic2NvcmUiOjEwLCJub09mRGFydHMiOjN9LHsic2NvcmUiOjEwMCwibm9PZkRhcnRzIjozfSx7InNjb3JlIjo3NSwibm9PZkRhcnRzIjozfSx7InNjb3J';

        await renderComponent(null, data);

        expect(reportedError).toBeFalsy();
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).not.toBeNull();
        expect(dataError.querySelector('p').innerHTML).toBe('Unexpected end of JSON input');
    });

    it('logged out - renders given valid incomplete json data', async () => {
        const jsonData = {
            startingScore: 123,
            numberOfLegs: 2,
            data: {
                legs: {
                    '0': {

                    }
                }
            },
            homeScore: 1,
            yourName: 'you',
            opponentName: ''
        };
        const data = '#' + btoa(JSON.stringify(jsonData));

        await renderComponent(null, data);

        expect(reportedError).toBeFalsy();
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeNull();
        const inputs = context.container.querySelectorAll('input');
        expect(inputs.length).toBe(5); // the settings + score input
    });

    it('logged out - renders given valid completed json data', async () => {
        const jsonData = {
            startingScore: 123,
            numberOfLegs: 1,
            data: {
                legs: {
                }
            },
            homeScore: 1,
            awayScore: 2,
            yourName: 'you',
            opponentName: 'them'
        };
        const data = '#' + btoa(JSON.stringify(jsonData));

        await renderComponent(null, data);

        expect(reportedError).toBeFalsy();
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).toBeNull();
        const matchStatistics = context.container.querySelector('h4');
        expect(matchStatistics).not.toBeNull();
        expect(matchStatistics.innerHTML).toBe('Match statistics');
    });

    it('logged out - renders given invalid base64 data', async () => {
        const data = '#invalid base64';

        await renderComponent(null, data);

        expect(reportedError).toBeFalsy();
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).not.toBeNull();
        expect(dataError.querySelector('p').innerHTML).toBe('The string to be decoded contains invalid characters.');
    });

    it('logged out - renders given invalid json data', async () => {
        const data = '#' + btoa(JSON.stringify(['invalid']));

        await renderComponent(null, data);

        expect(reportedError).toBeFalsy();
        const dataError = context.container.querySelector('div[data-name="data-error"]');
        expect(dataError).not.toBeNull();
        expect(dataError.querySelector('p').innerHTML).toBe('Invalid share data');
    });
});