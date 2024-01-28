import React from "react";
import {
    cleanUp,
    renderApp,
    doClick,
    findButton,
    doChange,
    noop,
    TestContext,
    iocProps,
    brandingProps, api, appProps
} from "../../helpers/tests";
import {DataBrowser} from "./DataBrowser";
import {createTemporaryId, repeat} from "../../helpers/projection";
import {renderDate} from "../../helpers/rendering";
import {ISingleDataResultDto} from "../../interfaces/serverSide/Data/ISingleDataResultDto";
import {IAppContainerProps} from "../../AppContainer";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IError} from "../../interfaces/IError";
import {IDataApi} from "../../api/data";
import {IFailedRequest} from "../../interfaces/IFailedRequest";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('DataBrowser', () => {
    let context: TestContext;
    let requestedData: { table: string, id?: string };
    let apiResult: IClientActionResultDto<ISingleDataResultDto | ISingleDataResultDto[]>;
    let apiException: IError;
    const dataApi = api<IDataApi>({
        browse: async (table: string, id?: string): Promise<IClientActionResultDto<ISingleDataResultDto | ISingleDataResultDto[]>> => {
            requestedData = { table, id };
            if (apiException) {
                throw apiException;
            }

            return apiResult || {
                success: true,
                result: (id ? { id } : []),
            };
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        apiException = null;
        requestedData = null;
        apiResult = null;
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
            }));

            const tableInput = context.container.querySelector('input[name="table"]') as HTMLInputElement;
            const idInput = context.container.querySelector('input[name="id"]') as HTMLInputElement;
            expect(tableInput.value).toEqual('');
            expect(idInput.value).toEqual('');
        });

        it('table name from query string', async () => {
            await renderComponent(appProps({
                account: {},
            }), '?table=game');

            const tableInput = context.container.querySelector('input[name="table"]') as HTMLInputElement;
            expect(tableInput).toBeTruthy();
            expect(tableInput.value).toEqual('game');
        });

        it('id from query string', async () => {
            const id = createTemporaryId();
            await renderComponent(appProps({
                account: {},
            }), '?id=' + id);

            const idInput = context.container.querySelector('input[name="id"]') as HTMLInputElement;
            expect(idInput).toBeTruthy();
            expect(idInput.value).toEqual(id);
        });

        it('list of records', async () => {
            const game1 = {id: createTemporaryId(), date: '2023-10-13T00:00:00',name:'GAME 1'};
            const game2 = {id: createTemporaryId(), date: '2023-10-20T00:00:00',name:'GAME 2'};
            apiResult = {
                success: true,
                result: [game1, game2],
            };

            await renderComponent(appProps({
                account: {},
            }), '?table=game');

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
            apiResult = {
                success: true,
                result: game,
            };

            await renderComponent(appProps({
                account: {},
            }), '?table=game,id=' + game.id);

            const table = context.container.querySelector('table') as HTMLTableElement;
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tr')) as HTMLTableRowElement[];
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['id', 'date', 'name']);
            expect(rows.map(row => row.querySelector('td:nth-child(2)').textContent)).toEqual([game.id, renderDate(game.date), game.name]);
        });

        it('error when fetching', async () => {
            apiResult = {
                success: false,
                errors: ['SOME ERROR'],
            };

            await renderComponent(appProps({
                account: {},
            }), '?table=game');

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
            apiResult = error as any;

            await renderComponent(appProps({
                account: {}
            }), '?table=game&id=abcd');

            expect(context.container.textContent).toContain('id: The value \'abcd\' is not valid.');
        });

        it('internal server error when fetching', async () => {
            apiException = { message: 'Some error' };

            await renderComponent(appProps({
                account: {},
            }), '?table=game&id=abcd');

            expect(context.container.textContent).toContain('Some error');
        });

        it('results from a given page', async () => {
            apiResult = {
                success: true,
                result: repeat(25, index => {
                    return { id: `id ${index}`};
                }),
            };
            await renderComponent(appProps({
                account: {},
            }), '?table=game&page=1');

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
            }));

            expect(requestedData).toBeNull();
        });

        it('does not fetch if no table name', async () => {
            await renderComponent(appProps({
                account: {},
            }));
            let alert: string;
            window.alert = (msg) => alert = msg;

            await doClick(findButton(context.container, 'Fetch'));

            expect(alert).toEqual('Enter a table name (and optionally an id) first');
        });

        it('fetches when only table name supplied', async () => {
            await renderComponent(appProps({
                account: {},
            }));
            await doChange(context.container, 'input[name="table"]', 'TABLE', context.user);

            await doClick(findButton(context.container, 'Fetch'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith('/admin/browser/?table=TABLE');
        });

        it('fetches when table name and id supplied', async () => {
            await renderComponent(appProps({
                account: {},
            }));
            const id = createTemporaryId();
            await doChange(context.container, 'input[name="table"]', 'TABLE', context.user);
            await doChange(context.container, 'input[name="id"]', id, context.user);

            await doClick(findButton(context.container, 'Fetch'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/admin/browser/?table=TABLE&id=${id}`);
        });

        it('does not re-fetch when changing page', async () => {
            apiResult = {
                success: true,
                result: repeat(25, index => {
                    return { id: createTemporaryId(), name: `ITEM ${index}`};
                }),
            };
            await renderComponent(appProps({
                account: {},
            }), '?table=game');
            console.error = noop; //silence warnings about navigation in tests

            requestedData = null;
            const page2 = context.container.querySelector('div[datatype="pages"] a.btn:nth-child(2)') as HTMLAnchorElement;
            await doClick(page2);

            expect(requestedData).toBeNull();
        });

        it('fetches immediately if table name set in query string', async () => {
            await renderComponent(appProps({
                account: {},
            }), '?table=TABLE');

            expect(requestedData).toEqual({
                id: '',
                table: 'TABLE',
            });
        });

        it('fetches immediately if table name and id set in query string', async () => {
            const id = createTemporaryId();
            await renderComponent(appProps({
                account: {},
            }), '?table=TABLE&id=' + id);

            expect(requestedData).toEqual({
                id: id,
                table: 'TABLE',
            });
        });

        it('does not re-fetch immediately if table name changes when initially set in query string', async () => {
            await renderComponent(appProps({
                account: {},
            }), '?table=TABLE');

            requestedData = null;
            await doChange(context.container, 'input[name="table"]', 'NEW NAME', context.user);

            expect(requestedData).toBeNull();
        });

        it('does not re-fetch immediately if id changes when initially set in query string', async () => {
            const id1 = createTemporaryId();
            const id2 = createTemporaryId();
            await renderComponent(appProps({
                account: {},
            }), '?table=TABLE&id=' + id1);

            requestedData = null;
            await doChange(context.container, 'input[name="id"]', id2, context.user);

            expect(requestedData).toBeNull();
        });
    });
});