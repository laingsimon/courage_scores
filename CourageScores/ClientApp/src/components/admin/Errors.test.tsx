import { act } from '@testing-library/react';
import { AdminContainer } from './AdminContainer';
import { Errors } from './Errors';
import { all } from '../../helpers/collections';
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { ErrorDetailDto } from '../../interfaces/models/dtos/ErrorDetailDto';
import { IErrorApi } from '../../interfaces/apis/IErrorApi';

describe('Errors', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let errorToThrow: Error | null = null;
    const recentMap: { [key: string]: ErrorDetailDto[] } = {};
    const errorApi = api<IErrorApi>({
        getRecent: async (since: string): Promise<ErrorDetailDto[]> => {
            if (errorToThrow) {
                throw errorToThrow;
            }
            return recentMap[since];
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        errorToThrow = null;
    });

    async function renderComponent() {
        context = await renderApp(
            iocProps({ errorApi }),
            brandingProps(),
            appProps(
                {
                    account: {
                        name: '',
                        emailAddress: '',
                        givenName: '',
                    },
                },
                reportedError,
            ),
            <AdminContainer tables={[]} accounts={[]}>
                <Errors />
            </AdminContainer>,
        );
    }

    async function clickRefresh(since: string, apiResults: ErrorDetailDto[]) {
        recentMap[since] = apiResults;
        await context.button('Refresh').click();
    }

    async function setDate(since: string) {
        // since must be a date (otherwise event will fire with an empty string)
        await context.input('date').change(since);
    }

    async function clickErrorItem(index: number) {
        const listItems = context.all(
            '.content-background .list-group li.list-group-item',
        );
        const clickEvent = new MouseEvent('click', { bubbles: true });
        await act(async () => {
            listItems[index].element().dispatchEvent(clickEvent);
        });
    }

    interface IAssertionProps extends ErrorDetailDto {
        // assertions
        time: string;
        url: string;
        type: string;
        stack?: string[];
    }

    function assertDisplayedErrors({
        time,
        url,
        type,
        stack,
    }: IAssertionProps) {
        assertTitle(time);
        assertUrl(url);
        assertType(type);
        assertStack(stack);
    }

    function getDetailsContainer() {
        return context.required('.content-background div.overflow-auto');
    }

    function assertTitle(time: string) {
        const title = getDetailsContainer().required('h6');
        expect(title.html()).toEqual(
            `Error details @ ${new Date(time).toLocaleString()}`,
        );
    }

    function assertUrl(url?: string) {
        const ps = getDetailsContainer().all('p');
        const urlP = ps.filter((p) => p.html().indexOf('Url') !== -1)[0];
        if (url) {
            expect(urlP).toBeTruthy();
            expect(urlP.html()).toContain(url);
        } else {
            expect(urlP).toBeFalsy();
        }
    }

    function assertType(type?: string) {
        const ps = getDetailsContainer().all('p');
        const typeP = ps.filter((p) => p.html().indexOf('Type') !== -1)[0];
        if (type) {
            expect(typeP).toBeTruthy();
            expect(typeP.html()).toContain(type);
        } else {
            expect(typeP).toBeFalsy();
        }
    }

    function assertStack(stack?: string[]) {
        const stackList = getDetailsContainer().optional('ol');
        if (stack) {
            expect(stackList).toBeTruthy();
            all(stack, (item: string) => {
                expect(stackList!.html()).toContain(item);
                return true;
            });
        } else {
            expect(stackList).toBeFalsy();
        }
    }

    function assertResults(count: number): IComponent[] {
        const resultsContainer = context.required(
            '.content-background .list-group',
        );
        const results = resultsContainer.all('li');
        expect(results.length).toEqual(count);
        return results;
    }

    function assertListItem(li: IComponent, { time, message, source }) {
        expect(li.html()).toContain(message);
        expect(li.html()).toContain(new Date(time).toLocaleTimeString());
        expect(li.html()).toContain(new Date(time).toLocaleDateString());
        expect(li.required('.badge').html()).toEqual(source);
    }

    it('shows no results on load', async () => {
        await renderComponent();

        assertResults(0);
        reportedError.verifyNoError();
    });

    it('shows empty results when none found', async () => {
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', []);

        assertResults(0);
        reportedError.verifyNoError();
    });

    it('shows error dialog on error', async () => {
        await renderComponent();
        errorToThrow = new Error('Some error');
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', []);

        assertResults(0);
        reportedError.verifyErrorEquals({
            message: 'Some error',
            stack: expect.any(String),
        });
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
        const apiItem = results.filter(
            (li) => li.html().indexOf('message1') !== -1,
        )[0];
        const uiItem = results.filter(
            (li) => li.html().indexOf('message2') !== -1,
        )[0];
        assertListItem(apiItem, apiError);
        assertListItem(uiItem, uiError);
        reportedError.verifyNoError();
    });

    it('shows api details on click', async () => {
        const data: IAssertionProps = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Api',
            url: 'some url',
            type: 'some type',
            stack: ['frame1', 'frame2'],
        };
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [data]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        reportedError.verifyNoError();
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
        reportedError.verifyNoError();
    });

    it('shows ui details on click', async () => {
        const data: IAssertionProps = {
            time: '2001-02-03T04:05:06Z',
            id: 'abcd',
            message: 'message1',
            source: 'Ui',
            url: 'some url',
            type: 'some type',
            stack: ['frame1', 'frame2'],
        };
        await renderComponent();
        await setDate('2001-02-03');
        await clickRefresh('2001-02-03', [data]);
        await clickErrorItem(0);

        assertDisplayedErrors(data);
        reportedError.verifyNoError();
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
        reportedError.verifyNoError();
    });
});
