import {
    cleanUp,
    renderApp,
    doClick,
    findButton,
    doChange,
    noop,
    TestContext,
    iocProps,
    brandingProps,
    api,
    appProps,
    ErrorState,
    doSelectOption,
} from '../../helpers/tests';
import { DataBrowser } from './DataBrowser';
import { createTemporaryId, repeat } from '../../helpers/projection';
import { renderDate } from '../../helpers/rendering';
import { SingleDataResultDto } from '../../interfaces/models/dtos/Data/SingleDataResultDto';
import { IAppContainerProps } from '../common/AppContainer';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { IError } from '../common/IError';
import { IFailedRequest } from '../common/IFailedRequest';
import { IDataApi } from '../../interfaces/apis/IDataApi';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { AdminContainer } from './AdminContainer';
import { TableDto } from '../../interfaces/models/dtos/Data/TableDto';

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('DataBrowser', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let requestedData: { table: string; id: string | null } | null;
    let singleApiResult: IClientActionResultDto<object> | null;
    let multiApiResult: IClientActionResultDto<SingleDataResultDto[]> | null;
    let apiException: IError | null;
    let tables: TableDto[] = [];
    const dataApi = api<IDataApi>({
        view: async (
            table: string,
            id: string,
        ): Promise<IClientActionResultDto<object>> => {
            requestedData = { table, id };
            if (apiException) {
                throw apiException;
            }

            return (
                singleApiResult || {
                    success: true,
                    result: { id },
                }
            );
        },
        getRows: async (
            table: string,
        ): Promise<IClientActionResultDto<SingleDataResultDto[]>> => {
            requestedData = { table, id: null };
            if (apiException) {
                throw apiException;
            }

            return (
                multiApiResult || {
                    success: true,
                    result: [],
                }
            );
        },
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
        tables = [{ name: 'game', partitionKey: 'id' }];
    });

    async function renderComponent(
        props: IAppContainerProps,
        queryString?: string,
    ) {
        context = await renderApp(
            iocProps({ dataApi }),
            brandingProps(),
            props,
            <AdminContainer tables={tables} accounts={[]}>
                <DataBrowser />
            </AdminContainer>,
            '/admin/:mode',
            '/admin/browser' + queryString,
        );
    }

    function account(): UserDto {
        return {
            name: '',
            givenName: '',
            emailAddress: '',
        };
    }

    function getSelectedTable(): string {
        const tableDropdownToggle =
            context.container.querySelector('.dropdown-toggle');
        expect(tableDropdownToggle).toBeTruthy();
        return tableDropdownToggle!.textContent.trim();
    }

    function getId(): string {
        const input = context.container.querySelector(
            'input[name="id"]',
        ) as HTMLInputElement;
        expect(input).toBeTruthy();
        return input.value;
    }

    function getResultRows(): HTMLTableRowElement[] {
        const table = context.container.querySelector(
            'table',
        ) as HTMLTableElement;
        expect(table).toBeTruthy();
        return Array.from(
            table.querySelectorAll('tbody > tr'),
        ) as HTMLTableRowElement[];
    }

    async function setSelectedTable(table: string) {
        await doSelectOption(
            context.container.querySelector('.dropdown-menu'),
            table,
        );
    }

    async function setId(id: string) {
        await doChange(context.container, 'input[name="id"]', id, context.user);
    }

    describe('renders', () => {
        it('with no query string', async () => {
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
            );

            expect(getSelectedTable()).toEqual('');
            expect(getId()).toEqual('');
        });

        it('table name from query string', async () => {
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game',
            );

            expect(getSelectedTable()).toEqual('game');
        });

        it('id from query string', async () => {
            const id = createTemporaryId();
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?id=' + id,
            );

            expect(getId()).toEqual(id);
        });

        it('list of records', async () => {
            const game1 = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            const game2 = {
                id: createTemporaryId(),
                date: '2023-10-20T00:00:00',
                name: 'GAME 2',
            };
            multiApiResult = {
                success: true,
                result: [game1, game2],
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game',
            );

            const list = context.container.querySelector(
                '.list-group',
            ) as HTMLElement;
            expect(list).toBeTruthy();
            const items = Array.from(
                list.querySelectorAll('.list-group-item'),
            ) as HTMLElement[];
            expect(items.length).toEqual(2);
            expect(items.map((item) => item.textContent)).toEqual([
                game1.id + game1.name + renderDate(game1.date),
                game2.id + game2.name + renderDate(game2.date),
            ]);
        });

        it('single record', async () => {
            const game = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + game.id,
            );

            const rows = getResultRows();
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(1)')!.textContent,
                ),
            ).toEqual(['id', 'date', 'name']);
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(2)')!.textContent,
                ),
            ).toEqual([game.id, renderDate(game.date), game.name]);
        });

        it('single record excluding cosmos properties', async () => {
            const game = { _id: 'COSMOS', id: createTemporaryId() };
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + createTemporaryId(),
            );

            const rows = getResultRows();
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(1)')!.textContent,
                ),
            ).toEqual(['id']);
        });

        it('single record including empty values', async () => {
            const game = { empty: '', id: createTemporaryId() };
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' +
                    createTemporaryId() +
                    '&showEmptyValues=true',
            );

            const rows = getResultRows();
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(1)')!.textContent,
                ),
            ).toEqual(['empty', 'id']);
        });

        it('single record including null values', async () => {
            const game = { nullValue: '', id: createTemporaryId() };
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' +
                    createTemporaryId() +
                    '&showEmptyValues=true',
            );

            const rows = getResultRows();
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(1)')!.textContent,
                ),
            ).toEqual(['nullValue', 'id']);
        });

        it('single record including undefined values', async () => {
            const game = { undefinedValue: undefined, id: createTemporaryId() };
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' +
                    createTemporaryId() +
                    '&showEmptyValues=true',
            );

            const rows = getResultRows();
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(1)')!.textContent,
                ),
            ).toEqual(['undefinedValue', 'id']);
        });

        it('single record including audit values', async () => {
            const game = {
                Remover: 'REMOVER',
                Deleted: 'DELETED',
                Editor: 'EDITOR',
                Updated: 'UPDATED',
                Author: 'AUTHOR',
                Created: 'CREATED',
                id: createTemporaryId(),
            };
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + game.id + '&showAuditValues=true',
            );

            const rows = getResultRows();
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(1)')!.textContent,
                ),
            ).toEqual([
                'Remover',
                'Deleted',
                'Editor',
                'Updated',
                'Author',
                'Created',
                'id',
            ]);
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(2)')!.textContent,
                ),
            ).toEqual([
                'REMOVER',
                'DELETED',
                'EDITOR',
                'UPDATED',
                'AUTHOR',
                'CREATED',
                game.id,
            ]);
        });

        it('single record including id', async () => {
            const game = {
                id: 'PARENT_ID',
                child: { id: 'CHILD_ID', grandChild: { id: 'GRANDCHILD_ID' } },
            };
            singleApiResult = {
                success: true,
                result: game,
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' +
                    createTemporaryId() +
                    '&showIdsUptoDepth=2',
            );

            const rows = Array.from(
                context.container.querySelectorAll('div > table > tbody > tr'),
            ) as HTMLTableRowElement[];
            expect(
                rows.map(
                    (row) => row.querySelector('td:nth-child(1)')!.textContent,
                ),
            ).toEqual(['id', 'child']);
            const childRows = Array.from(
                rows[1].querySelectorAll('table > tbody > tr'),
            ) as HTMLTableRowElement[];
            expect(
                childRows.map(
                    (row) => row.querySelector('td:nth-child(1)')!.textContent,
                ),
            ).toEqual(['id', 'grandChild']);
            expect(context.container.textContent).not.toContain(
                'GRANDCHILD_ID',
            );
        });

        it('error when fetching', async () => {
            multiApiResult = {
                success: false,
                errors: ['SOME ERROR'],
            };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game',
            );

            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('bad request when fetching', async () => {
            const error: IFailedRequest = {
                errors: {
                    id: ["The value 'abcd' is not valid."],
                },
                title: 'One or more validation errors occurred.',
                status: 400,
            };
            singleApiResult = error as IClientActionResultDto<object>;

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=abcd',
            );

            expect(context.container.textContent).toContain(
                "id: The value 'abcd' is not valid.",
            );
        });

        it('internal server error when fetching', async () => {
            apiException = { message: 'Some error' };

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=abcd',
            );

            expect(context.container.textContent).toContain('Some error');
        });

        it('results from a given page', async () => {
            multiApiResult = {
                success: true,
                result: repeat(25, (index) => {
                    return { id: `id ${index}` };
                }),
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&page=1',
            );

            const list = context.container.querySelector(
                '.list-group',
            ) as HTMLElement;
            expect(list).toBeTruthy();
            const items = Array.from(
                list.querySelectorAll('.list-group-item'),
            ) as HTMLElement[];
            expect(items.map((item) => item.textContent)).toEqual([
                'id 10',
                'id 11',
                'id 12',
                'id 13',
                'id 14',
                'id 15',
                'id 16',
                'id 17',
                'id 18',
                'id 19',
            ]);
        });
    });

    describe('interactivity', () => {
        it('does not fetch if no table name on load', async () => {
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
            );

            expect(requestedData).toBeNull();
        });

        it('does not fetch if no table name', async () => {
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
            );

            await doClick(findButton(context.container, 'Fetch'));

            context.prompts.alertWasShown(
                'Select a container (and optionally an id) first',
            );
        });

        it('fetches when only table name supplied', async () => {
            tables.push({ name: 'TABLE', partitionKey: 'id' });

            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
            );
            await setSelectedTable('TABLE');

            await doClick(findButton(context.container, 'Fetch'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                '/admin/browser/?container=TABLE',
            );
        });

        it('fetches when table name and id supplied', async () => {
            tables.push({ name: 'TABLE', partitionKey: 'id' });
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
            );
            const id = createTemporaryId();
            await setSelectedTable('TABLE');
            await setId(id);

            await doClick(findButton(context.container, 'Fetch'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                `/admin/browser/?container=TABLE&id=${id}`,
            );
        });

        it('does not re-fetch when changing page', async () => {
            multiApiResult = {
                success: true,
                result: repeat(25, (index) => {
                    return { id: createTemporaryId(), name: `ITEM ${index}` };
                }),
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game',
            );
            console.error = noop; //silence warnings about navigation in tests

            requestedData = null;
            const page2 = context.container.querySelector(
                'div[datatype="pages"] a.btn:nth-child(2)',
            ) as HTMLAnchorElement;
            await doClick(page2);

            expect(requestedData).toBeNull();
        });

        it('fetches immediately if table name set in query string', async () => {
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=TABLE',
            );

            expect(requestedData).toEqual({
                id: null,
                table: 'TABLE',
            });
        });

        it('fetches immediately if table name and id set in query string', async () => {
            const id = createTemporaryId();
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=TABLE&id=' + id,
            );

            expect(requestedData).toEqual({
                id: id,
                table: 'TABLE',
            });
        });

        it('does not re-fetch immediately if table name changes when initially set in query string', async () => {
            tables.push({ name: 'TABLE', partitionKey: 'id' });
            tables.push({ name: 'NEW NAME', partitionKey: 'id' });
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=TABLE',
            );

            requestedData = null;
            await setSelectedTable('NEW NAME');

            expect(requestedData).toBeNull();
        });

        it('does not re-fetch immediately if id changes when initially set in query string', async () => {
            const id1 = createTemporaryId();
            const id2 = createTemporaryId();
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=TABLE&id=' + id1,
            );

            requestedData = null;
            await setId(id2);

            expect(requestedData).toBeNull();
        });

        it('can change view option, to show empty values', async () => {
            const game = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + game.id,
            );

            await doClick(
                context.container,
                'input[type="checkbox"][id="showEmptyValues"]',
            );

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                `/admin/browser/?container=game&id=${game.id}&showEmptyValues=true`,
            );
        });

        it('can change view option, to un-show empty values', async () => {
            const game = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + game.id + '&showEmptyValues=true',
            );

            await doClick(
                context.container,
                'input[type="checkbox"][id="showEmptyValues"]',
            );

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                `/admin/browser/?container=game&id=${game.id}`,
            );
        });

        it('can change view option, to show audit values', async () => {
            const game = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + game.id,
            );

            await doClick(
                context.container,
                'input[type="checkbox"][id="showAuditValues"]',
            );

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                `/admin/browser/?container=game&id=${game.id}&showAuditValues=true`,
            );
        });

        it('can change view option, to un-show audit values', async () => {
            const game = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + game.id + '&showAuditValues=true',
            );

            await doClick(
                context.container,
                'input[type="checkbox"][id="showAuditValues"]',
            );

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                `/admin/browser/?container=game&id=${game.id}`,
            );
        });

        it('can change view option, to show version', async () => {
            const game = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + game.id,
            );

            await doClick(
                context.container,
                'input[type="checkbox"][id="showVersion"]',
            );

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                `/admin/browser/?container=game&id=${game.id}&showVersion=true`,
            );
        });

        it('can change view option, to un-show version', async () => {
            const game = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=game&id=' + game.id + '&showVersion=true',
            );

            await doClick(
                context.container,
                'input[type="checkbox"][id="showVersion"]',
            );

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                `/admin/browser/?container=game&id=${game.id}`,
            );
        });

        it('can navigate from item view to search results', async () => {
            const game = {
                id: createTemporaryId(),
                date: '2023-10-13T00:00:00',
                name: 'GAME 1',
            };
            singleApiResult = {
                success: true,
                result: game,
            };
            await renderComponent(
                appProps(
                    {
                        account: account(),
                    },
                    reportedError,
                ),
                '?container=TABLE&id=' + game.id,
            );
            requestedData = null;

            await setId('');
            reportedError.verifyNoError();
            await doClick(findButton(context.container, 'Fetch'));

            reportedError.verifyNoError();
            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                `/admin/browser/?container=TABLE`,
            );
        });
    });
});
