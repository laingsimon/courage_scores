import { AdminContainer, IAdminContainerProps } from './AdminContainer';
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { ImportData } from './ImportData';
import { ImportDataRequestDto } from '../../interfaces/models/dtos/Data/ImportDataRequestDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { ImportDataResultDto } from '../../interfaces/models/dtos/Data/ImportDataResultDto';
import { IDataApi } from '../../interfaces/apis/IDataApi';

describe('ImportData', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let importRequest: ImportDataRequestDto | null;
    let apiResponse: IClientActionResultDto<ImportDataResultDto> | null;
    const dataApi = api<IDataApi>({
        import: async (
            request: ImportDataRequestDto,
        ): Promise<IClientActionResultDto<ImportDataResultDto>> => {
            importRequest = request;
            return (
                apiResponse || {
                    success: true,
                    result: { tables: {} },
                    errors: [],
                    warnings: [],
                    messages: [],
                }
            );
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        apiResponse = null;
        importRequest = null;
    });

    async function renderComponent(adminProps: IAdminContainerProps) {
        context = await renderApp(
            iocProps({ dataApi }),
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
            <AdminContainer {...adminProps}>
                <ImportData />
            </AdminContainer>,
        );
    }

    async function setFileToImport() {
        const file = 'some content';
        await context.required('input[type="file"]').file(file);
    }

    const props: IAdminContainerProps = {
        tables: [
            { name: 'Table 1', canImport: true, partitionKey: '' },
            { name: 'Table 2', canImport: false, partitionKey: '' },
        ],
        accounts: [],
    };

    it('renders tables', async () => {
        await renderComponent(props);

        reportedError.verifyNoError();
        const tables = context.all('ul li');
        expect(tables.map((t) => t.text())).toEqual(['Table 1', 'Table 2']);
    });

    it('can select importable table', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        expect(table1).toBeTruthy();
        expect(table1.className()).toContain('active');

        await table1.click();

        expect(table1.className()).not.toContain('active');
    });

    it('cannot select non-importable table', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table2 = tables.filter(
            (t) => t.text().indexOf('Table 2') !== -1,
        )[0];
        expect(table2).toBeTruthy();
        expect(table2.className()).not.toContain('active');

        await table2.click();

        expect(table2.className()).not.toContain('active');
    });

    it('cannot import when no file selected', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).toBeNull();
        context.prompts.alertWasShown('Select a file first');
    });

    it('cannot import when no tables selected', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') !== -1) {
            await table1.click();
        }
        await setFileToImport();

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).toBeNull();
        context.prompts.alertWasShown('Select some tables to import');
    });

    it('can import data with password', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') === -1) {
            await table1.click();
        }
        await context.input('password').change('pass');
        await setFileToImport();

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).toEqual({
            dryRun: true,
            purgeData: false,
            password: 'pass',
            tables: ['Table 1'],
        });
    });

    it('can import data without password', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') === -1) {
            await table1.click();
        }
        await setFileToImport();

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).toEqual({
            dryRun: true,
            purgeData: false,
            password: '',
            tables: ['Table 1'],
        });
    });

    it('can import data with purge and commit', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') === -1) {
            await table1.click();
        }
        await context.input('purgeData').click();
        await context.input('dryRun').click();
        await setFileToImport();

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).toEqual({
            dryRun: false,
            purgeData: true,
            password: '',
            tables: ['Table 1'],
        });
    });

    it('renders import results', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') === -1) {
            await table1.click();
        }
        await setFileToImport();
        apiResponse = {
            success: true,
            result: {
                tables: {
                    'Table 1': 5,
                },
            },
            errors: ['some_error'],
            warnings: ['some_warning'],
            messages: ['some_message'],
        };

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(context.text()).toContain('Table 1: 5 row/s imported');
        expect(context.text()).toContain('some_error');
        expect(context.text()).toContain('some_warning');
        expect(context.text()).toContain('some_message');
    });

    it('can handle error during import', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') === -1) {
            await table1.click();
        }
        await setFileToImport();
        apiResponse = { success: false };

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).not.toBeNull();
        expect(context.text()).toContain('Could not import data');
    });

    it('can handle http 500 error during import', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') === -1) {
            await table1.click();
        }
        await setFileToImport();
        apiResponse = {
            status: 500,
            body: {},
            text: async () => 'some text error',
        };

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).not.toBeNull();
        expect(context.text()).toContain('Could not import data');
    });

    it('can handle http 400 error during import', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') === -1) {
            await table1.click();
        }
        await setFileToImport();
        apiResponse = {
            status: 400,
            body: {},
            json: async () => {
                return { errors: ['some error'] };
            },
        };

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).not.toBeNull();
        expect(context.text()).toContain('Could not import data');
    });

    it('can handle unexpected error during import', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        if (table1.className().indexOf('active') === -1) {
            await table1.click();
        }
        await setFileToImport();
        apiResponse = {
            status: 400,
            body: {},
            json: async () => {
                throw new Error('some error');
            },
        };
        console.error = noop;

        await context.button('Import data').click();

        reportedError.verifyNoError();
        expect(importRequest).not.toBeNull();
        expect(context.text()).toContain('Could not import data');
    });
});
