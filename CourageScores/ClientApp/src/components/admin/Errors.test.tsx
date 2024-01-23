import {act} from "@testing-library/react";
import {AdminContainer} from "./AdminContainer";
import React from "react";
import {Errors} from "./Errors";
import {all} from "../../helpers/collections";
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {IErrorDetailDto} from "../../interfaces/serverSide/IErrorDetailDto";
import {IErrorApi} from "../../api/error";

describe('Errors', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let errorToThrow = null;
    const recentMap: { [key: string]: IErrorDetailDto[] } = {};
    const errorApi = api<IErrorApi>({
        getRecent: async (since: string): Promise<IErrorDetailDto[]> => {
            if (errorToThrow) {
                throw errorToThrow;
            }
            return recentMap[since];
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        errorToThrow = null;
    });

    async function renderComponent() {
        context = await renderApp(
            iocProps({errorApi}),
            brandingProps(),
            appProps({
                account: {},
            }, reportedError),
            (<AdminContainer tables={[]} accounts={[]}>
                <Errors/>
            </AdminContainer>));
    }

    async function clickRefresh(since: string, apiResults: IErrorDetailDto[]) {
        recentMap[since] = apiResults;
        await doClick(findButton(context.container, 'Refresh'));
    }

    async function setDate(since: string) {
        // since must be a date (otherwise event will fire with an empty string)
        await doChange(context.container, '.content-background .input-group input.form-control', since, context.user);
    }

    async function clickErrorItem(index: number) {
        const listItems = context.container.querySelectorAll(`.content-background .list-group li.list-group-item`);
        const clickEvent = new MouseEvent('click', {bubbles: true});
        await act(async () => {
            listItems[index].dispatchEvent(clickEvent);
        });
    }

    interface IAssertionProps extends IErrorDetailDto {
        // assertions
        time: string;
        url: string;
        type: string;
        stack?: string[];
    }

    function assertDisplayedErrors({time, url, type, stack}: IAssertionProps) {
        assertTitle(time);
        assertUrl(url);
        assertType(type);
        assertStack(stack);
    }

    function getDetailsContainer(): HTMLElement {
        const detailsContainer = context.container.querySelector(`.content-background div.overflow-auto`) as HTMLElement;
        expect(detailsContainer).toBeTruthy();
        return detailsContainer;
    }

    function assertTitle(time: string) {
        const title = getDetailsContainer().querySelector(`h6`) as HTMLHeadingElement;
        expect(title.innerHTML).toEqual(`Error details @ ${new Date(time).toLocaleString()}`);
    }

    function assertUrl(url?: string) {
        const ps = Array.from(getDetailsContainer().querySelectorAll('p')) as HTMLElement[];
        const urlP = ps.filter(p => p.innerHTML.indexOf('Url') !== -1)[0];
        if (url) {
            expect(urlP).toBeTruthy();
            expect(urlP.innerHTML).toContain(url);
        } else {
            expect(urlP).toBeFalsy();
        }
    }

    function assertType(type?: string) {
        const ps = Array.from(getDetailsContainer().querySelectorAll('p')) as HTMLElement[];
        const typeP = ps.filter(p => p.innerHTML.indexOf('Type') !== -1)[0];
        if (type) {
            expect(typeP).toBeTruthy();
            expect(typeP.innerHTML).toContain(type);
        } else {
            expect(typeP).toBeFalsy();
        }
    }

    function assertStack(stack?: string[]) {
        const stackList = getDetailsContainer().querySelector('ol') as HTMLElement;
        if (stack) {
            expect(stackList).toBeTruthy();
            all(stack, (item: string) => {
                expect(stackList.innerHTML).toContain(item);
                return true;
            });
        } else {
            expect(stackList).toBeFalsy();
        }
    }

    function assertResults(count: number): HTMLElement[] {
        const resultsContainer = context.container.querySelector(`.content-background .list-group`) as HTMLElement;
        expect(resultsContainer).not.toBeNull();
        const results = Array.from(resultsContainer.querySelectorAll(`li`)) as HTMLElement[];
        expect(results.length).toEqual(count);
        return results;
    }

    function assertListItem(li: HTMLElement, {time, message, source}) {
        expect(li.innerHTML).toContain(message);
        expect(li.innerHTML).toContain(new Date(time).toLocaleTimeString());
        expect(li.innerHTML).toContain(new Date(time).toLocaleDateString());
        expect(li.querySelector('.badge').innerHTML).toEqual(source);
    }

    it('shows no results on load', async () => {
        await renderComponent();

        assertResults(0);
        expect(reportedError.hasError()).toEqual(false);
    });

    it('shows empty results when none found', async () => {
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', []);

        assertResults(0);
        expect(reportedError.hasError()).toEqual(false);
    });

    it('shows error dialog on error', async () => {
        await renderComponent();
        errorToThrow = new Error('Some error');
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', []);

        assertResults(0);
        expect(reportedError.hasError()).toEqual(true);
    });

    it('shows results on refresh', async () => {
        const apiError = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd1',
            message: 'message1',
            source: 'Api',
        };
        const uiError = {
            time: '2001-02-03T05:06:07Z',
            id: 'abcd2',
            message: 'message2',
            source: 'Ui',
        };
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [apiError, uiError]);

        const results = assertResults(2);
        const apiItem = results.filter(li => li.innerHTML.indexOf('message1') !== -1)[0];
        const uiItem = results.filter(li => li.innerHTML.indexOf('message2') !== -1)[0];
        assertListItem(apiItem, apiError);
        assertListItem(uiItem, uiError);
        expect(reportedError.hasError()).toEqual(false);
    });

    it('shows api details on click', async () => {
        const data: IAssertionProps = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Api',
            url: 'some url',
            type: 'some type',
            stack: [
                'frame1',
                'frame2'
            ],
        };
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [data]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        expect(reportedError.hasError()).toEqual(false);
    });

    it('shows api details without some details on click', async () => {
        const data: IAssertionProps = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Api',
            url: '',
            type: '',
        };
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [data]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        expect(reportedError.hasError()).toEqual(false);
    });

    it('shows ui details on click', async () => {
        const data: IAssertionProps = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Ui',
            url: 'some url',
            type: 'some type',
            stack: [
                'frame1',
                'frame2'
            ],
        };
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [data]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        expect(reportedError.hasError()).toEqual(false);
    });

    it('shows ui details without some details on click', async () => {
        const data: IAssertionProps = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Ui',
            url: '',
            type: '',
        };
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [data]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        expect(reportedError.hasError()).toEqual(false);
    });
});