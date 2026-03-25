import {
    cleanUp,
    renderApp,
    TestContext,
    iocProps,
    brandingProps,
    appProps,
    ErrorState,
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
        const tableDropdownToggle = context.required('.dropdown-toggle');
        return tableDropdownToggle.text().trim();
    }

    async function setSelectedTable(table: string) {
        await context.required('.dropdown-menu').select(table);
    }

    function getQuery() {
        return context.input('query').value();
    }

    async function setQuery(query: string) {
        await context.input('query').change(query);
    }

    async function setMax(max: string) {
        await context.input('max').change(max);
    }

    function getCells() {
        const rows = context.all('table tbody tr');
        return rows.map((row) => row.all('td'));
    }

    function getRenderedValues(element?: string) {
        return getCells().map((row) => {
            return row.map((cell) =>
                element ? cell.optional(element)?.text() : cell.text(),
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

    function tsvRow(...values: string[]): string {
        return values.join('\t');
    }

    function tsv(...rows: string[]): string {
        return rows.join('\n');
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

            await context.button('Execute').click();

            const heading = context.required('table thead tr');
            const headers = Array.from(heading.all('th')).map((th) =>
                th.text(),
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

            await context.button('Execute').click();

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

            await context.button('Execute').click();

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

            await context.button('Execute').click();

            const links = getCells()[0].map((cell) => cell.optional('a'));
            expect(links.map((a) => a?.text())).toEqual([
                undefined,
                'relative',
                'absoluteHttp',
                'absoluteHttps',
            ]);
            expect(
                links.map((a) => a?.element<HTMLAnchorElement>().href),
            ).toEqual([
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

            await context.button('Execute').click();

            expect(getRenderedValues('abbr')).toEqual([
                [undefined, '3cb2-56e3'],
            ]);
        });

        it('nulls', async () => {
            await renderComponent('?query=select * from game&container=game');
            apiResponse = getApiResponse({
                id: null,
            });

            await context.button('Execute').click();

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

            await context.button('Execute').click();

            expect(getRenderedValues('pre')).toEqual([
                [undefined, JSON.stringify(obj, null, '  ')],
            ]);
        });

        it('exception when fetching', async () => {
            apiException = 'SOME ERROR';
            await renderComponent('?container=game&query=select * from game');

            await context.button('Execute').click();

            reportedError.verifyErrorEquals('SOME ERROR');
        });

        it('error when fetching', async () => {
            apiResponse = {
                success: false,
                errors: ['SOME ERROR'],
                warnings: ['SOME WARNING'],
            };
            await renderComponent('?container=game&query=select * from game');

            await context.button('Execute').click();

            expect(context.text()).toContain('SOME ERROR');
            expect(context.text()).toContain('SOME WARNING');
        });
    });

    describe('interactivity', () => {
        it('does not fetch if no container selected', async () => {
            await renderComponent('?query=select * from game');

            await context.button('Execute').click();

            expect(requestedData).toBeNull();
            context.prompts.alertWasShown('Select a container first');
        });

        it('does not fetch if no query', async () => {
            await renderComponent('?container=game');

            await context.button('Execute').click();

            expect(requestedData).toBeNull();
            context.prompts.alertWasShown('Enter a query first');
        });

        it('fetches given updated query', async () => {
            await renderComponent('?container=game&max=100');

            await setQuery('select * from game');
            await context.button('Execute').click();

            expect(requestedData).toEqual({
                container: 'game',
                max: 100,
                query: 'select * from game',
            });
        });

        it('updates the query in the address', async () => {
            await renderComponent('?container=game&max=100');

            await setQuery('select * from game');
            await context.required('textarea').blur();

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                '/admin/query/?container=game&max=100&query=select+*+from+game',
            );
        });

        it('clears the query in the address', async () => {
            await renderComponent('?container=game&max=100');

            await setQuery('');
            await context.required('textarea').blur();

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
            await context.button('Execute').click();
            const abbr = context.required('abbr');
            expect(abbr.element<HTMLElement>().title).toEqual(id);
            navigator.clipboard.writeText = mockedClipboardWrite;

            await abbr.click();

            expect(mockedClipboardWrite).toHaveBeenCalledWith(id);
        });

        it('alerts if there are no rows to export', async () => {
            await renderComponent(
                '?container=game&max=100&query=select+*+from+game',
            );
            apiResponse = getApiResponse();
            await context.button('Execute').click();

            await context.button('Download').click();

            context.prompts.alertWasShown('No rows to export');
        });

        it('produces tsv with results', async () => {
            const id = '3cb254cd-a60b-4a6e-9c11-89d5d98e56e3';
            const url = 'http://localhost/somewhere';
            const date = '2026-01-02T03:04:05.006Z';
            const text = 'some text';
            const object = { subProperty: 'value ' };
            await renderComponent(
                '?container=game&max=100&query=select+*+from+game',
            );
            apiResponse = getApiResponse({
                id,
                url: `[link text](${url})`,
                date,
                text,
                object,
                null: null,
            });
            await context.button('Execute').click();

            await context.button('Download').click();

            const expectedTsv = tsv(
                tsvRow('id', 'url', 'date', 'text', 'object', 'null'),
                tsvRow(id, url, date, text, JSON.stringify(object), 'null'),
            );
            const downloadLink = context.button('query.tsv');
            expect(downloadLink.element<HTMLAnchorElement>().href).toEqual(
                'data:text/tsv,' + encodeURI(expectedTsv),
            );
        });
    });
});
