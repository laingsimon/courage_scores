// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, renderApp, doClick, findButton, doChange, noop} from "../../helpers/tests";
import {DataBrowser} from "./DataBrowser";
import {createTemporaryId, repeat} from "../../helpers/projection";
import {renderDate} from "../../helpers/rendering";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('DataBrowser', () => {
    let context;
    let reportedError;
    let requestedData;
    let apiResult;
    let apiException;
    const dataApi = {
        browse: async (table, id) => {
            requestedData = { table, id };
            if (apiException) {
                throw apiException;
            }

            return apiResult || {
                success: true,
                result: (id ? { id } : []),
            };
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        apiException = null;
        reportedError = null;
        requestedData = null;
        apiResult = null;
    });

    async function renderComponent(props, queryString) {
        context = await renderApp(
            {dataApi},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                ...props
            },
            (<DataBrowser />),
            '/admin/:mode',
            '/admin/browser' + queryString);
    }

    describe('renders', () => {
        it('with no query string', async () => {
            await renderComponent({
                account: {},
            });

            const tableInput = context.container.querySelector('input[name="table"]');
            const idInput = context.container.querySelector('input[name="id"]');
            expect(tableInput.value).toEqual('');
            expect(idInput.value).toEqual('');
        });

        it('table name from query string', async () => {
            await renderComponent({
                account: {},
            }, '?table=game');

            const tableInput = context.container.querySelector('input[name="table"]');
            expect(tableInput).toBeTruthy();
            expect(tableInput.value).toEqual('game');
        });

        it('id from query string', async () => {
            const id = createTemporaryId();
            await renderComponent({
                account: {},
            }, '?id=' + id);

            const idInput = context.container.querySelector('input[name="id"]');
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

            await renderComponent({
                account: {},
            }, '?table=game');

            const list = context.container.querySelector('.list-group');
            expect(list).toBeTruthy();
            const items = Array.from(list.querySelectorAll('.list-group-item'));
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

            await renderComponent({
                account: {},
            }, '?table=game,id=' + game.id);

            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tr'));
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual(['id', 'date', 'name']);
            expect(rows.map(row => row.querySelector('td:nth-child(2)').textContent)).toEqual([game.id, game.date, game.name]);
        });

        it('error when fetching', async () => {
            apiResult = {
                success: false,
                errors: ['SOME ERROR'],
            };

            await renderComponent({
                account: {},
            }, '?table=game');

            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('bad request when fetching', async () => {
            apiResult = {
                errors: {
                    id: [
                        'The value \'abcd\' is not valid.'
                    ]
                },
                title: 'One or more validation errors occurred.',
                status: 400,
            };

            await renderComponent({
                account: {},
            }, '?table=game&id=abcd');

            expect(context.container.textContent).toContain('id: The value \'abcd\' is not valid.');
        });

        it('internal server error when fetching', async () => {
            apiException = { message: 'Some error' };

            await renderComponent({
                account: {},
            }, '?table=game&id=abcd');

            expect(context.container.textContent).toContain('Some error');
        });

        it('results from a given page', async () => {
            apiResult = {
                success: true,
                result: repeat(25, index => {
                    return { id: `id ${index}`};
                }),
            };
            await renderComponent({
                account: {},
            }, '?table=game&page=1');

            const list = context.container.querySelector('.list-group');
            expect(list).toBeTruthy();
            const items = Array.from(list.querySelectorAll('.list-group-item'));
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
            await renderComponent({
                account: {},
            });

            expect(requestedData).toBeNull();
        });

        it('does not fetch if no table name', async () => {
            await renderComponent({
                account: {},
            });
            let alert;
            window.alert = (msg) => alert = msg;

            await doClick(findButton(context.container, 'Fetch'));

            expect(alert).toEqual('Enter a table name (and optionally an id) first');
        });

        it('fetches when only table name supplied', async () => {
            await renderComponent({
                account: {},
            });
            await doChange(context.container, 'input[name="table"]', 'TABLE', context.user);

            await doClick(findButton(context.container, 'Fetch'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith('/admin/browser/?table=TABLE');
        });

        it('fetches when table name and id supplied', async () => {
            await renderComponent({
                account: {},
            });
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
            await renderComponent({
                account: {},
            }, '?table=game');
            console.error = noop; //silence warnings about navigation in tests

            requestedData = null;
            const page2 = context.container.querySelector('div[datatype="pages"] a.btn:nth-child(2)');
            await doClick(page2);

            expect(requestedData).toBeNull();
        });

        it('fetches immediately if table name set in query string', async () => {
            await renderComponent({
                account: {},
            }, '?table=TABLE');

            expect(requestedData).toEqual({
                id: '',
                table: 'TABLE',
            });
        });

        it('fetches immediately if table name and id set in query string', async () => {
            const id = createTemporaryId();
            await renderComponent({
                account: {},
            }, '?table=TABLE&id=' + id);

            expect(requestedData).toEqual({
                id: id,
                table: 'TABLE',
            });
        });

        it('does not re-fetch immediately if table name changes when initially set in query string', async () => {
            await renderComponent({
                account: {},
            }, '?table=TABLE');

            requestedData = null;
            await doChange(context.container, 'input[name="table"]', 'NEW NAME', context.user);

            expect(requestedData).toBeNull();
        });

        it('does not re-fetch immediately if id changes when initially set in query string', async () => {
            const id1 = createTemporaryId();
            const id2 = createTemporaryId();
            await renderComponent({
                account: {},
            }, '?table=TABLE&id=' + id1);

            requestedData = null;
            await doChange(context.container, 'input[name="id"]', id2, context.user);

            expect(requestedData).toBeNull();
        });
    });
});