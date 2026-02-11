import {
    cleanUp,
    renderApp,
    doClick,
    findButton,
    doChange,
    TestContext,
    iocProps,
    brandingProps,
    appProps,
    ErrorState,
    doSelectOption,
    api,
} from '../../helpers/tests';
import { createTemporaryId } from '../../helpers/projection';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { AdminContainer } from './AdminContainer';
import { TableDto } from '../../interfaces/models/dtos/Data/TableDto';
import { Query } from './Query';
import { QueryApi } from '../../interfaces/apis/IQueryApi';
import { QueryRequestDto } from '../../interfaces/models/dtos/Query/QueryRequestDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { QueryResponseDto } from '../../interfaces/models/dtos/Query/QueryResponseDto';
import { act, fireEvent } from '@testing-library/react';
import { renderDate } from '../../helpers/rendering';

const mockedUsedNavigate = jest.fn();
const mockedClipboardWrite = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('Query', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let requestedData: QueryRequestDto | null;
    let apiResponse: IClientActionResultDto<QueryResponseDto> | null;
    let apiException: string | null;
    let tables: TableDto[] = [];

    const queryApi = api<QueryApi>({
        async execute(
            request: QueryRequestDto,
        ): Promise<IClientActionResultDto<QueryResponseDto>> {
            requestedData = request;
            if (apiException) {
                throw apiException;
            }
            return (
                apiResponse ?? {
                    success: true,
                }
            );
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        jest.resetAllMocks();
        requestedData = null;
        apiResponse = null;
        apiException = null;
        reportedError = new ErrorState();
        tables = [{ name: 'game', partitionKey: 'id' }];
    });

    async function renderComponent(queryString?: string) {
        context = await renderApp(
            iocProps({ queryApi }),
            brandingProps(),
            appProps(
                {
                    account: account(),
                },
                reportedError,
            ),
            <AdminContainer tables={tables} accounts={[]}>
                <Query />
            </AdminContainer>,
            '/admin/query',
            '/admin/query' + (queryString || ''),
        );

        reportedError.verifyNoError();
    }

    function account(): UserDto {
        return {
            name: '',
            givenName: '',
            emailAddress: '',
        };
    }

    function request(query?: string, container?: string) {
        return {
            query: query ?? 'select * from game',
            container: container ?? 'game',
        };
    }

    function getSelectedTable(): string {
        const tableDropdownToggle =
            context.container.querySelector('.dropdown-toggle');
        expect(tableDropdownToggle).toBeTruthy();
        return tableDropdownToggle!.textContent.trim();
    }

    async function setSelectedTable(table: string) {
        await doSelectOption(
            context.container.querySelector('.dropdown-menu'),
            table,
        );
    }

    function getQuery() {
        const query = context.container.querySelector(
            'textarea[name="query"]',
        ) as HTMLTextAreaElement;
        return query.value;
    }

    async function setQuery(query: string) {
        await doChange(
            context.container,
            'textarea[name="query"]',
            query,
            context.user,
        );
    }

    async function setMax(max: string) {
        await doChange(
            context.container,
            'input[name="max"]',
            max,
            context.user,
        );
    }

    function getCells() {
        const rows = Array.from(
            context.container.querySelectorAll('table tbody tr'),
        );
        return rows.map((row) => Array.from(row.querySelectorAll('td')));
    }

    function getRenderedValues(element?: string) {
        return getCells().map((row) => {
            return row.map((cell) =>
                element
                    ? cell.querySelector(element)?.textContent
                    : cell.textContent,
            );
        });
    }

    function getApiResponse(...rows: object[]) {
        return {
            success: true,
            result: {
                rowCount: 10,
                rows,
                request: request(),
            },
        };
    }

    describe('renders', () => {
        it('with no query string', async () => {
            await renderComponent();

            expect(getSelectedTable()).toEqual('');
            expect(getQuery()).toEqual('');
        });

        it('table name from query string', async () => {
            await renderComponent('?container=game');

            expect(getSelectedTable()).toEqual('game');
        });

        it('query from query string', async () => {
            const query = createTemporaryId();
            await renderComponent('?query=' + query);

            expect(getQuery()).toEqual(query);
        });

        it('list of records', async () => {
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse(
                {
                    col1: 'a',
                    col2: 'b',
                },
                {
                    col2: 'b',
                    col3: 'c',
                },
            );

            await doClick(findButton(context.container, 'Execute'));

            const heading = context.container.querySelector('table thead tr')!;
            const headers = Array.from(heading.querySelectorAll('th')).map(
                (th) => th.textContent,
            );
            expect(headers).toEqual(['#', 'col1', 'col2', 'col3']);
            expect(getRenderedValues()).toEqual([
                ['1', 'a', 'b', ''],
                ['2', '', 'b', 'c'],
            ]);
        });

        it('dates', async () => {
            const date = '2026-01-01T00:00:00.000Z';
            const time = '2026-01-01T10:20:30.000Z';
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse({
                date,
                time,
            });

            await doClick(findButton(context.container, 'Execute'));

            expect(getRenderedValues('abbr')).toEqual([
                [undefined, renderDate(date), renderDate(time) + ' @ 10:20'],
            ]);
        });

        it('urls', async () => {
            const relative = '/somewhere-relative';
            const absoluteHttp = 'http://somewhere-absolute';
            const absoluteHttps = 'https://somewhere-absolute';
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse({
                relative,
                absoluteHttp,
                absoluteHttps,
            });

            await doClick(findButton(context.container, 'Execute'));

            expect(getRenderedValues('a')).toEqual([
                [undefined, relative, absoluteHttp, absoluteHttps],
            ]);
        });

        it('markdown urls', async () => {
            const relative = '[relative](/somewhere-relative)';
            const absoluteHttp = '[absoluteHttp](http://somewhere-absolute)';
            const absoluteHttps = '[absoluteHttps](https://somewhere-absolute)';
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse({
                relative,
                absoluteHttp,
                absoluteHttps,
            });

            await doClick(findButton(context.container, 'Execute'));

            const links = getCells()[0].map((cell) => cell.querySelector('a')!);
            expect(links.map((a) => a?.textContent)).toEqual([
                undefined,
                'relative',
                'absoluteHttp',
                'absoluteHttps',
            ]);
            expect(links.map((a) => a?.href)).toEqual([
                undefined,
                'http://localhost/somewhere-relative',
                'http://somewhere-absolute/',
                'https://somewhere-absolute/',
            ]);
        });

        it('ids', async () => {
            const id = '3cb254cd-a60b-4a6e-9c11-89d5d98e56e3';
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse({
                id,
            });

            await doClick(findButton(context.container, 'Execute'));

            expect(getRenderedValues('abbr')).toEqual([
                [undefined, '3cb2-56e3'],
            ]);
        });

        it('nulls', async () => {
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse({
                id: null,
            });

            await doClick(findButton(context.container, 'Execute'));

            expect(getRenderedValues()).toEqual([['1', 'null']]);
        });

        it('objects', async () => {
            const obj = {
                prop: 'value',
            };
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse({
                obj,
            });

            await doClick(findButton(context.container, 'Execute'));

            expect(getRenderedValues('pre')).toEqual([
                [undefined, JSON.stringify(obj, null, '  ')],
            ]);
        });

        it('exception when fetching', async () => {
            apiException = 'SOME ERROR';
            await renderComponent('?container=game&query=select * from game');

            await doClick(findButton(context.container, 'Execute'));

            reportedError.verifyErrorEquals('SOME ERROR');
        });

        it('error when fetching', async () => {
            apiResponse = {
                success: false,
                errors: ['SOME ERROR'],
                warnings: ['SOME WARNING'],
            };
            await renderComponent('?container=game&query=select * from game');

            await doClick(findButton(context.container, 'Execute'));

            expect(context.container.textContent).toContain('SOME ERROR');
            expect(context.container.textContent).toContain('SOME WARNING');
        });
    });

    describe('interactivity', () => {
        it('does not fetch if no container selected', async () => {
            await renderComponent('?query=select * from game');

            await doClick(findButton(context.container, 'Execute'));

            expect(requestedData).toBeNull();
            context.prompts.alertWasShown('Select a container first');
        });

        it('does not fetch if no query', async () => {
            await renderComponent('?container=game');

            await doClick(findButton(context.container, 'Execute'));

            expect(requestedData).toBeNull();
            context.prompts.alertWasShown('Enter a query first');
        });

        it('fetches given updated query', async () => {
            await renderComponent('?container=game&max=100');

            await setQuery('select * from game');
            await doClick(findButton(context.container, 'Execute'));

            expect(requestedData).toEqual({
                container: 'game',
                max: 100,
                query: 'select * from game',
            });
        });

        it('updates the query in the address', async () => {
            await renderComponent('?container=game&max=100');

            await setQuery('select * from game');
            act(() => {
                fireEvent.blur(
                    context.container.querySelector('textarea')!,
                    {},
                );
            });

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                '/admin/query/?container=game&max=100&query=select+*+from+game',
            );
        });

        it('clears the query in the address', async () => {
            await renderComponent('?container=game&max=100');

            await setQuery('');
            act(() => {
                fireEvent.blur(
                    context.container.querySelector('textarea')!,
                    {},
                );
            });

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                '/admin/query/?container=game&max=100',
            );
        });

        it('updates the container in the address', async () => {
            await renderComponent('?query=select * from game&max=100');

            await setSelectedTable('game');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                '/admin/query/?query=select+*+from+game&max=100&container=game',
            );
        });

        it('updates the max rows in the address', async () => {
            await renderComponent('?query=select * from game&container=game');

            await setMax('100');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                '/admin/query/?query=select+*+from+game&container=game&max=100',
            );
        });

        it('updates the query to template', async () => {
            await renderComponent();

            await setSelectedTable('game');

            expect(getQuery()).toEqual('select *\nfrom game g');
        });

        it('can copy id to clipboard', async () => {
            const id = '3cb254cd-a60b-4a6e-9c11-89d5d98e56e3';
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse({
                id,
            });
            await doClick(findButton(context.container, 'Execute'));
            const abbr = context.container.querySelector('abbr')!;
            expect(abbr.title).toEqual(id);
            navigator.clipboard.writeText = mockedClipboardWrite;

            await doClick(abbr);

            expect(mockedClipboardWrite).toHaveBeenCalledWith(id);
        });
    });
});
