// noinspection JSUnresolvedFunction

import {act} from "@testing-library/react";
import {AdminContainer} from "./AdminContainer";
import React from "react";
import {Errors} from "./Errors";
import {all} from "../../Utilities";
import {doClick,doChange,renderApp,cleanUp} from "../../tests/helpers";

describe('Errors', () => {
    let context;
    const recentMap = {};
    const mockErrorApi = {
        getRecent: (since) => {
            return recentMap[since];
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent() {
        context = await renderApp(
            { errorApi: mockErrorApi },
            { account: {}, appLoading: false },
            (<AdminContainer>
                <Errors />
            </AdminContainer>));
    }

    async function clickRefresh(since, apiResults) {
        recentMap[since] = apiResults;
        await doClick(context.container, '.light-background .input-group button.btn-primary');
    }

    function setDate(since) {
        // since must be a date (otherwise event will fire with an empty string)
        doChange(context.container, '.light-background .input-group input.form-control', since);
    }

    async function clickErrorItem(index) {
        const listItems = context.container.querySelectorAll(`.light-background .list-group li.list-group-item`);
        const clickEvent = new MouseEvent('click', { bubbles: true });
        await act(async () => {
            listItems[index].dispatchEvent(clickEvent);
        });
    }

    function assertDisplayedErrors({ time, url, type, stack }) {
        const detailsContainer = context.container.querySelector(`.light-background div.overflow-auto`);
        expect(detailsContainer).toBeTruthy();
        const title = detailsContainer.querySelector(`h6`);
        expect(title.innerHTML).toEqual(`Error details @ ${new Date(time).toLocaleString()}`);
        const ps = Array.from(detailsContainer.querySelectorAll('p'));
        const urlP = ps.filter(p => p.innerHTML.indexOf('Url') !== -1)[0];
        if (url) {
            expect(urlP).toBeTruthy();
            expect(urlP.innerHTML).toContain(url);
        } else {
            expect(urlP).toBeFalsy();
        }
        const typeP = ps.filter(p => p.innerHTML.indexOf('Type') !== -1)[0];
        if (type) {
            expect(typeP).toBeTruthy();
            expect(typeP.innerHTML).toContain(type);
        } else {
            expect(typeP).toBeFalsy();
        }
        const stackList = detailsContainer.querySelector('ol');
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
        const results = Array.from(resultsContainer.querySelectorAll(`.light-background .list-group li`));
        expect(results.length).toEqual(count);
        return results;
    }

    function assertListItem(li, { time, message, source }) {
        expect(li.innerHTML).toContain(message);
        expect(li.innerHTML).toContain(new Date(time).toLocaleTimeString());
        expect(li.innerHTML).toContain(new Date(time).toLocaleDateString());
        expect(li.querySelector('.badge').innerHTML).toBe(source);
    }

    it('shows no results on load', async () => {
        await renderComponent();

        assertResults(0);
    });

    it('shows empty results when none found', async () => {
        await renderComponent();
        setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ ]);

        assertResults(0);
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
        setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ apiError, uiError ]);

        const results = assertResults(2);
        const apiItem = results.filter(li => li.innerHTML.indexOf('message1') !== -1)[0];
        const uiItem = results.filter(li => li.innerHTML.indexOf('message2') !== -1)[0];
        assertListItem(apiItem, apiError);
        assertListItem(uiItem, uiError);
    });

    it('shows api details on click', async () => {
        const error = {
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
        setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ error ]);
        await clickErrorItem(0);

        assertDisplayedErrors(error);
    });

    it('shows api details without some details on click', async () => {
        const error = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Api'
        }
        await renderComponent();
        setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ error ]);
        await clickErrorItem(0);

        assertDisplayedErrors(error);
    });

    it('shows ui details on click', async () => {
        const error = {
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
        setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ error ]);
        await clickErrorItem(0);

        assertDisplayedErrors(error);
    });

    it('shows ui details without some details on click', async () => {
        const error = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Ui'
        }
        await renderComponent();
        setDate('2001-02-03');
        await clickRefresh('2001-02-03', [ error ]);
        await clickErrorItem(0);

        assertDisplayedErrors(error);
    });
});