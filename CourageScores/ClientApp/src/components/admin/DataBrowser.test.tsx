import {
    cleanUp,
    renderApp,
    doClick,
    findButton,
    doChange,
    noop,
    TestContext,
    iocProps,
    brandingProps, api, appProps, ErrorState
} from "../../helpers/tests";
import {DataBrowser} from "./DataBrowser";
import {createTemporaryId, repeat} from "../../helpers/projection";
import {renderDate} from "../../helpers/rendering";
import {SingleDataResultDto} from "../../interfaces/models/dtos/Data/SingleDataResultDto";
import {IAppContainerProps} from "../common/AppContainer";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {IError} from "../common/IError";
import {IFailedRequest} from "../common/IFailedRequest";
import {IDataApi} from "../../interfaces/apis/IDataApi";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('DataBrowser', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let requestedData: { table: string, id?: string };
    let singleApiResult: IClientActionResultDto<object>;
    let multiApiResult: IClientActionResultDto<SingleDataResultDto[]>;
    let apiException: IError;
    const dataApi = api<IDataApi>({
        view: async (table: string, id: string): Promise<IClientActionResultDto<object>> => {
            requestedData = { table, id };
            if (apiException) {
                throw apiException;
            }

            return singleApiResult || {
                success: true,
                result: { id }
            };
        },
        getRows: async (table: string): Promise<IClientActionResultDto<SingleDataResultDto[]>> => {
            requestedData = { table, id: null };
            if (apiException) {
                throw apiException;
            }

            return multiApiResult || {
                success: true,
                result: [],
            };
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        apiException = null;
        requestedData = null;
        singleApiResult = null;
        multiApiResult = null;
        reportedError = new ErrorState();
    });

    async function renderComponent(props: IAppContainerProps, queryString?: string) {
        context = await renderApp(
            iocProps({dataApi}),
            brandingProps(),
            props,
            (<DataBrowser />),
            '/admin/:mode',
            '/admin/browser' + queryString);
    }

    describe('renders', () => {
        it('with no query string', async () => {
            await renderComponent(appProps({
                account: {},
            }, reportedError));

            const tableInput = context.container.querySelector('input[name="table"]') as HTMLInputElement;
            const idInput = context.container.querySelector('input[name="id"]') as HTMLInputElement;
            expect(tableInput.value).toEqual('');
            expect(idInput.value).toEqual('');
        });

        it('table name from query string', async () => {
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game');

            const tableInput = context.container.querySelector('input[name="table"]') as HTMLInputElement;
            expect(tableInput).toBeTruthy();
            expect(tableInput.value).toEqual('game');
        });

        it('id from query string', async () => {
            const id = createTemporaryId();
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?id=' + id);

            const idInput = context.container.querySelector('input[name="id"]') as HTMLInputElement;
            expect(idInput).toBeTruthy();
            expect(idInput.value).toEqual(id);
        });

        it('list of records', async () => {
            const game1 = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            const game2 = {id: createTemporaryId(), date: '2023-10-20T00:00:00',name:'GAME 2'};
            multiApiResult = {
                success: true,
                result: [game1, game2],
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game');

            const list = context.container.querySelector('.list-group') as HTMLElement;
            expect(list).toBeTruthy();
            const items = Array.from(list.querySelectorAll('.list-group-item')) as HTMLElement[];
            expect(items.length).toEqual(2);
            expect(items.map(item => item.textContent)).toEqual([
                game1.id + game1.name + renderDate(game1.date),
                game2.id + game2.name + renderDate(game2.date),
            ]);
        });

        it('single record', async () => {
            const game = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + game.id);

            const table = context.container.querySelector('table') as HTMLTableElement;
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLTableRowElement[];
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['id', 'date', 'name']);
            expect(rows.map(row => row.querySelector('td:nth-child(2)').textContent)).toEqual([game.id, renderDate(game.date), game.name]);
        });

        it('single record excluding cosmos properties', async () => {
            const game = {'_id': 'COSMOS', id: createTemporaryId()};
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + createTemporaryId());

            const table = context.container.querySelector('table') as HTMLTableElement;
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLTableRowElement[];
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['id']);
        });

        it('single record including empty values', async () => {
            const game = {empty: '', id: createTemporaryId()};
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + createTemporaryId() + '&showEmptyValues=true');

            const table = context.container.querySelector('table') as HTMLTableElement;
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLTableRowElement[];
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['empty', 'id']);
        });

        it('single record including null values', async () => {
            const game = {nullValue: '', id: createTemporaryId()};
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + createTemporaryId() + '&showEmptyValues=true');

            const table = context.container.querySelector('table') as HTMLTableElement;
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLTableRowElement[];
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['nullValue', 'id']);
        });

        it('single record including undefined values', async () => {
            const game = {undefinedValue: undefined, id: createTemporaryId()};
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + createTemporaryId() + '&showEmptyValues=true');

            const table = context.container.querySelector('table') as HTMLTableElement;
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLTableRowElement[];
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['undefinedValue', 'id']);
        });

        it('single record including audit values', async () => {
            const game = {Remover: 'REMOVER', Deleted: 'DELETED', Editor: 'EDITOR', Updated: 'UPDATED', Author: 'AUTHOR', Created: 'CREATED', id: createTemporaryId()};
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + game.id + '&showAuditValues=true');

            const table = context.container.querySelector('table') as HTMLTableElement;
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLTableRowElement[];
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['Remover', 'Deleted', 'Editor', 'Updated', 'Author', 'Created', 'id']);
            expect(rows.map(row => row.querySelector('td:nth-child(2)').textContent)).toEqual(['REMOVER', 'DELETED', 'EDITOR', 'UPDATED', 'AUTHOR', 'CREATED', game.id]);
        });

        it('single record including id', async () => {
            const game = {id: 'PARENT_ID', child: { id: 'CHILD_ID', grandChild: { id: 'GRANDCHILD_ID' }}};
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + createTemporaryId() + '&showIdsUptoDepth=2');

            const rows = Array.from(context.container.querySelectorAll('div > table > tbody > tr')) as HTMLTableRowElement[];
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['id', 'child']);
            const childRows = Array.from(rows[1].querySelectorAll('table > tbody > tr')) as HTMLTableRowElement[];
            expect(childRows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['id', 'grandChild']);
            expect(context.container.textContent).not.toContain('GRANDCHILD_ID');
        });

        it('error when fetching', async () => {
            multiApiResult = {
                success: false,
                errors: ['SOME ERROR'],
            };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game');

            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('bad request when fetching', async () => {
            const error: IFailedRequest = {
                errors: {
                    id: [
                        'The value \'abcd\' is not valid.'
                    ]
                },
                title: 'One or more validation errors occurred.',
                status: 400,
            };
            singleApiResult = error as any;

            await renderComponent(appProps({
                account: {}
            }, reportedError), '?table=game&id=abcd');

            expect(context.container.textContent).toContain('id: The value \'abcd\' is not valid.');
        });

        it('internal server error when fetching', async () => {
            apiException = { message: 'Some error' };

            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=abcd');

            expect(context.container.textContent).toContain('Some error');
        });

        it('results from a given page', async () => {
            multiApiResult = {
                success: true,
                result: repeat(25, index => {
                    return { id: `id ${index}`};
                }),
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&page=1');

            const list = context.container.querySelector('.list-group') as HTMLElement;
            expect(list).toBeTruthy();
            const items = Array.from(list.querySelectorAll('.list-group-item')) as HTMLElement[];
            expect(items.map(item => item.textContent)).toEqual([
                'id 10',
                'id 11',
                'id 12',
                'id 13',
                'id 14',
                'id 15',
                'id 16',
                'id 17',
                'id 18',
                'id 19'
            ]);
        });
    });

    describe('interactivity', () => {
        it('does not fetch if no table name on load', async () => {
            await renderComponent(appProps({
                account: {},
            }, reportedError));

            expect(requestedData).toBeNull();
        });

        it('does not fetch if no table name', async () => {
            await renderComponent(appProps({
                account: {},
            }, reportedError));
            let alert: string;
            window.alert = (msg) => alert = msg;

            await doClick(findButton(context.container, 'Fetch'));

            expect(alert).toEqual('Enter a table name (and optionally an id) first');
        });

        it('fetches when only table name supplied', async () => {
            await renderComponent(appProps({
                account: {},
            }, reportedError));
            await doChange(context.container, 'input[name="table"]', 'TABLE', context.user);

            await doClick(findButton(context.container, 'Fetch'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith('/admin/browser/?table=TABLE');
        });

        it('fetches when table name and id supplied', async () => {
            await renderComponent(appProps({
                account: {},
            }, reportedError));
            const id = createTemporaryId();
            await doChange(context.container, 'input[name="table"]', 'TABLE', context.user);
            await doChange(context.container, 'input[name="id"]', id, context.user);

            await doClick(findButton(context.container, 'Fetch'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=TABLE&id=${id}`);
        });

        it('does not re-fetch when changing page', async () => {
            multiApiResult = {
                success: true,
                result: repeat(25, index => {
                    return { id: createTemporaryId(), name: `ITEM ${index}`};
                }),
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game');
            console.error = noop; //silence warnings about navigation in tests

            requestedData = null;
            const page2 = context.container.querySelector('div[datatype="pages"] a.btn:nth-child(2)') as HTMLAnchorElement;
            await doClick(page2);

            expect(requestedData).toBeNull();
        });

        it('fetches immediately if table name set in query string', async () => {
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=TABLE');

            expect(requestedData).toEqual({
                id: null,
                table: 'TABLE',
            });
        });

        it('fetches immediately if table name and id set in query string', async () => {
            const id = createTemporaryId();
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=TABLE&id=' + id);

            expect(requestedData).toEqual({
                id: id,
                table: 'TABLE',
            });
        });

        it('does not re-fetch immediately if table name changes when initially set in query string', async () => {
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=TABLE');

            requestedData = null;
            await doChange(context.container, 'input[name="table"]', 'NEW NAME', context.user);

            expect(requestedData).toBeNull();
        });

        it('does not re-fetch immediately if id changes when initially set in query string', async () => {
            const id1 = createTemporaryId();
            const id2 = createTemporaryId();
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=TABLE&id=' + id1);

            requestedData = null;
            await doChange(context.container, 'input[name="id"]', id2, context.user);

            expect(requestedData).toBeNull();
        });

        it('can change view option, to show empty values', async () => {
            const game = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + game.id);

            await doClick(context.container, 'input[type="checkbox"][id="showEmptyValues"]');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=game&id=${game.id}&showEmptyValues=true`);
        });

        it('can change view option, to un-show empty values', async () => {
            const game = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + game.id + '&showEmptyValues=true');

            await doClick(context.container, 'input[type="checkbox"][id="showEmptyValues"]');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=game&id=${game.id}`);
        });

        it('can change view option, to show audit values', async () => {
            const game = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + game.id);

            await doClick(context.container, 'input[type="checkbox"][id="showAuditValues"]');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=game&id=${game.id}&showAuditValues=true`);
        });

        it('can change view option, to un-show audit values', async () => {
            const game = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + game.id + '&showAuditValues=true');

            await doClick(context.container, 'input[type="checkbox"][id="showAuditValues"]');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=game&id=${game.id}`);
        });

        it('can change view option, to show version', async () => {
            const game = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + game.id);

            await doClick(context.container, 'input[type="checkbox"][id="showVersion"]');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=game&id=${game.id}&showVersion=true`);
        });

        it('can change view option, to un-show version', async () => {
            const game = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=game&id=' + game.id + '&showVersion=true');

            await doClick(context.container, 'input[type="checkbox"][id="showVersion"]');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=game&id=${game.id}`);
        });

        it('can navigate from item view to search results', async () => {
            const game = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(appProps({
                account: {},
            }, reportedError), '?table=TABLE&id=' + game.id);
            requestedData = null;

            await doChange(context.container, 'input[name="id"]', '', context.user);
            reportedError.verifyNoError();
            await doClick(findButton(context.container, 'Fetch'));

            reportedError.verifyNoError();
            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=TABLE`);
        });
    });
});