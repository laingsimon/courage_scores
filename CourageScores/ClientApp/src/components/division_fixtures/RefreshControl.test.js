// noinspection JSUnresolvedFunction

import {cleanUp, doSelectOption, renderApp} from "../../helpers/tests";
import React from "react";
import {RefreshControl} from "./RefreshControl";
import {act} from "@testing-library/react";

describe('RefreshControl', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        jest.useFakeTimers();
    });

    async function renderComponent(props) {
        reportedError = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<RefreshControl {...props} />));
    }

    describe('renders', () => {
        it('options', async () => {
            await renderComponent({
                refreshInterval: 0,
                refresh: () => {},
                setRefreshInterval: () => {},
            });

            const items = Array.from(context.container.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(items.map(li => li.textContent)).toEqual([ '⏸️ Paused', '⏩ Live (Fast)', '▶️ Live' ]);
        });

        it('selected option', async () => {
            await renderComponent({
                refreshInterval: 10000,
                refresh: () => {},
                setRefreshInterval: () => {},
            });

            const selectedItem = context.container.querySelector('.dropdown-menu .dropdown-item.active')
            expect(selectedItem.textContent).toEqual('⏩ Live (Fast)');
        });
    });

    describe('interactivity', () => {
        it('changes selected refresh speed', async () => {
            let newInterval;

            await renderComponent({
                refreshInterval: 10000,
                refresh: () => {},
                setRefreshInterval: (v) => { newInterval = v },
            });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

            expect(newInterval).toEqual(60000);
        });

        it('stops refreshing when paused', async () => {
            let newInterval = 100; // an invalid speed, intentionally, to prevent delays in the tests
            let refreshCount = 0;
            let releaseLatch;
            const latch = new Promise(r => {
                releaseLatch = r;
            });
            await renderComponent({
                refreshInterval: newInterval,
                refresh: async () => {
                    refreshCount++;
                    await doSelectOption(context.container.querySelector('.dropdown-menu'), '⏸️ Paused');
                    releaseLatch();
                },
                setRefreshInterval: (v) => { newInterval = v },
            });

            await act(async () => {
                jest.advanceTimersToNextTimer();
                await latch;
            });

            expect(newInterval).toEqual(0);
            expect(refreshCount).toEqual(1);
        });
    })
});