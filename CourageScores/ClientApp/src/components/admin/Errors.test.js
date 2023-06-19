// noinspection JSUnresolvedFunction

import {act} from "@testing-library/react";
import {AdminContainer} from "./AdminContainer";
import React from "react";
import {Errors} from "./Errors";
import {all} from "../../helpers/collections";
import {doClick, doChange, renderApp, cleanUp, findButton} from "../../helpers/tests";

describe('Errors', () => {
    let context;
    let reportedError;
    let errorToThrow = null;
    const recentMap = { };
    const errorApi = {
        getRecent: (since) => {
            if (errorToThrow) {
                throw errorToThrow;
            }
            return recentMap[since];
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent() {
        reportedError = null;
        errorToThrow = null;
        context = await renderApp(
            { errorApi },
            {
                account: { },
                appLoading: false,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<AdminContainer>
                <Errors />
            </AdminContainer>));
    }

    async function clickRefresh(since, apiResults) {
        recentMap[since] = apiResults;
        await doClick(findButton(context.container, 'Refresh'));
    }

    async function setDate(since) {
        // since must be a date (otherwise event will fire with an empty string)
        await doChange(context.container, '.light-background .input-group input.form-control', since, context.user);
    }

    async function clickErrorItem(index) {
        const listItems = context.container.querySelectorAll(`.light-background .list-group li.list-group-item`);
        const clickEvent = new MouseEvent('click', { bubbles: true });
        await act(async () => {
            listItems[index].dispatchEvent(clickEvent);
        });
    }

    function assertDisplayedErrors({ time, url, type, stack }) {
        assertTitle(time);
        assertUrl(url);
        assertType(type);
        assertStack(stack);
    }

    function getDetailsContainer() {
        const detailsContainer = context.container.querySelector(`.light-background div.overflow-auto`);
        expect(detailsContainer).toBeTruthy();
        return detailsContainer;
    }

    function assertTitle(time) {
        const title = getDetailsContainer().querySelector(`h6`);
        expect(title.innerHTML).toEqual(`Error details @ ${new Date(time).toLocaleString()}`);
    }

    function assertUrl(url) {
        const ps = Array.from(getDetailsContainer().querySelectorAll('p'));
        const urlP = ps.filter(p => p.innerHTML.indexOf('Url') !== -1)[0];
        if (url) {
            expect(urlP).toBeTruthy();
            expect(urlP.innerHTML).toContain(url);
        } else {
            expect(urlP).toBeFalsy();
        }
    }

    function assertType(type) {
        const ps = Array.from(getDetailsContainer().querySelectorAll('p'));
        const typeP = ps.filter(p => p.innerHTML.indexOf('Type') !== -1)[0];
        if (type) {
            expect(typeP).toBeTruthy();
            expect(typeP.innerHTML).toContain(type);
        } else {
            expect(typeP).toBeFalsy();
        }
    }

    function assertStack(stack) {
        const stackList = getDetailsContainer().querySelector('ol');
        if (stack) {
            expect(stackList).toBeTruthy();
            all(stack, item => {
                expect(stackList.innerHTML).toContain(item);
            });
        } else {
            expect(stackList).toBeFalsy();
        }
    }

    function assertResults(count) {
        const resultsContainer = context.container.querySelector(`.light-background .list-group`);
        expect(resultsContainer).not.toBeNull();
        const results = Array.from(resultsContainer.querySelectorAll(`li`));
        expect(results.length).toEqual(count);
        return results;
    }

    function assertListItem(li, { time, message, source }) {
        expect(li.innerHTML).toContain(message);
        expect(li.innerHTML).toContain(new Date(time).toLocaleTimeString());
        expect(li.innerHTML).toContain(new Date(time).toLocaleDateString());
        expect(li.querySelector('.badge').innerHTML).toEqual(source);
    }

    it('shows no results on load', async () => {
        await renderComponent();

        assertResults(0);
        expect(reportedError).toBeNull();
    });

    it('shows empty results when none found', async () => {
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ ]);

        assertResults(0);
        expect(reportedError).toBeNull();
    });

    it('shows error dialog on error', async () => {
        await renderComponent();
        errorToThrow = new Error('Some error');
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ ]);

        assertResults(0);
        expect(reportedError).not.toBeNull();
    });

    it('shows results on refresh', async () => {
        const apiError = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd1',
            message: 'message1',
            source: 'Api'
        }
        const uiError = {
            time: '2001-02-03T05:06:07Z',
            id: 'abcd2',
            message: 'message2',
            source: 'Ui'
        }
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ apiError, uiError ]);

        const results = assertResults(2);
        const apiItem = results.filter(li => li.innerHTML.indexOf('message1') !== -1)[0];
        const uiItem = results.filter(li => li.innerHTML.indexOf('message2') !== -1)[0];
        assertListItem(apiItem, apiError);
        assertListItem(uiItem, uiError);
        expect(reportedError).toBeNull();
    });

    it('shows api details on click', async () => {
        const data = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Api',
            url: 'some url',
            type: 'some type',
            stack: [
                'frame1',
                'frame2'
            ]
        }
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ data ]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        expect(reportedError).toBeNull();
    });

    it('shows api details without some details on click', async () => {
        const data = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Api'
        }
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ data ]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        expect(reportedError).toBeNull();
    });

    it('shows ui details on click', async () => {
        const data = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Ui',
            url: 'some url',
            type: 'some type',
            stack: [
                'frame1',
                'frame2'
            ]
        }
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ data ]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        expect(reportedError).toBeNull();
    });

    it('shows ui details without some details on click', async () => {
        const data = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Ui'
        }
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ data ]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        expect(reportedError).toBeNull();
    });
});