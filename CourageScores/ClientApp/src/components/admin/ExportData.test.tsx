import { AdminContainer, IAdminContainerProps } from './AdminContainer';
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { ExportData } from './ExportData';
import { ExportDataRequestDto } from '../../interfaces/models/dtos/Data/ExportDataRequestDto';
import { ExportDataResultDto } from '../../interfaces/models/dtos/Data/ExportDataResultDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { IDataApi } from '../../interfaces/apis/IDataApi';

describe('ExportData', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let exportRequest: ExportDataRequestDto | null;
    let apiResponse: IClientActionResultDto<ExportDataResultDto> | null;
    const dataApi = api<IDataApi>({
        export: async (
            request: ExportDataRequestDto,
        ): Promise<IClientActionResultDto<ExportDataResultDto>> => {
            exportRequest = request;
            return apiResponse || { success: true, result: { zip: '' } };
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        apiResponse = null;
        exportRequest = null;
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
                <ExportData />
            </AdminContainer>,
        );
    }

    const props: IAdminContainerProps = {
        tables: [
            { name: 'Table 1', canExport: true, partitionKey: '' },
            { name: 'Table 2', canExport: false, partitionKey: '' },
        ],
        accounts: [],
    };

    it('renders tables', async () => {
        await renderComponent(props);

        reportedError.verifyNoError();
        const tables = context.all('ul li');
        expect(tables.map((t) => t.text())).toEqual(['Table 1', 'Table 2']);
    });

    it('can select exportable table', async () => {
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

    it('cannot select non-exportable table', async () => {
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

    it('cannot export when no tables selected', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        const tables = context.all('ul li');
        const table1 = tables.filter(
            (t) => t.text().indexOf('Table 1') !== -1,
        )[0];
        expect(table1.className()).toContain('active');
        await table1.click(); // deselect table 1

        await context.button('Export data').click();

        reportedError.verifyNoError();
        expect(exportRequest).toBeNull();
        context.prompts.alertWasShown('Select some tables to export');
    });

    it('can export data with password', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        await context.input('password').change('pass');

        await context.button('Export data').click();

        reportedError.verifyNoError();
        expect(exportRequest).toEqual({
            includeDeletedEntries: true,
            password: 'pass',
            tables: { 'Table 1': [] },
        });
    });

    it('can export data without password', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();

        await context.button('Export data').click();

        reportedError.verifyNoError();
        expect(exportRequest).toEqual({
            includeDeletedEntries: true,
            password: '',
            tables: { 'Table 1': [] },
        });
    });

    it('can export data without deleted entries', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        await context.input('includeDeletedEntries').click();

        await context.button('Export data').click();

        reportedError.verifyNoError();
        expect(exportRequest).toEqual({
            includeDeletedEntries: false,
            password: '',
            tables: { 'Table 1': [] },
        });
    });

    it('can download zip', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        apiResponse = {
            success: true,
            result: {
                zip: 'ZIP CONTENT',
            },
        };
        await context.button('Export data').click();

        reportedError.verifyNoError();
        const downloadButton = context.required('a[download="export.zip"]');
        expect(downloadButton.element<HTMLAnchorElement>().href).toEqual(
            'data:application/zip;base64,ZIP CONTENT',
        );
    });

    it('can handle error during export', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        apiResponse = { success: false };

        await context.button('Export data').click();

        reportedError.verifyNoError();
        expect(exportRequest).not.toBeNull();
        expect(context.text()).toContain('Could not export data');
    });

    it('can close error report from export', async () => {
        await renderComponent(props);
        reportedError.verifyNoError();
        apiResponse = { success: false };
        await context.button('Export data').click();
        expect(context.text()).toContain('Could not export data');

        await context.button('Close').click();

        expect(context.text()).not.toContain('Could not export data');
    });
});
