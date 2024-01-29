import {AdminContainer, IAdminContainerProps} from "./AdminContainer";
import React from "react";
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
import {ExportData} from "./ExportData";
import {IExportDataRequestDto} from "../../interfaces/dtos/Data/IExportDataRequestDto";
import {IExportDataResultDto} from "../../interfaces/dtos/Data/IExportDataResultDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IDataApi} from "../../api/data";

describe('ExportData', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let exportRequest: IExportDataRequestDto;
    let apiResponse: IClientActionResultDto<IExportDataResultDto>;
    const dataApi = api<IDataApi>({
        export: async (request: IExportDataRequestDto): Promise<IClientActionResultDto<IExportDataResultDto>> => {
            exportRequest = request;
            return apiResponse || {success: true, result: {zip: ''}};
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        apiResponse = null;
        exportRequest = null;
    });

    async function renderComponent(adminProps: IAdminContainerProps) {
        context = await renderApp(
            iocProps({dataApi}),
            brandingProps(),
            appProps({
                account: {},
            }, reportedError),
            (<AdminContainer {...adminProps}>
                <ExportData/>
            </AdminContainer>));
    }

    const props: IAdminContainerProps = {
        tables: [
            {name: 'Table 1', canExport: true, environmentalName: '', partitionKey: ''},
            {name: 'Table 2', canExport: false, environmentalName: '', partitionKey: ''}
        ],
        accounts: [],
    };

    it('renders tables', async () => {
        await renderComponent(props);

        expect(reportedError.hasError()).toEqual(false);
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        expect(tables.map(t => t.textContent)).toEqual(['Table 1', 'Table 2']);
    });

    it('can select exportable table', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        expect(table1).toBeTruthy();
        expect(table1.className).toContain('active');

        await doClick(table1);

        expect(table1.className).not.toContain('active');
    });

    it('cannot select non-exportable table', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table2 = tables.filter(t => t.textContent.indexOf('Table 2') !== -1)[0];
        expect(table2).toBeTruthy();
        expect(table2.className).not.toContain('active');

        await doClick(table2);

        expect(table2.className).not.toContain('active');
    });

    it('cannot export when no tables selected', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);
        let alert: string;
        window.alert = (msg) => alert = msg;
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        expect(table1.className).toContain('active');
        await doClick(table1); // deselect table 1

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError.hasError()).toEqual(false);
        expect(exportRequest).toBeNull();
        expect(alert).toEqual('Select some tables to export');
    });

    it('can export data with password', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);
        await doChange(context.container, 'input[name="password"]', 'pass', context.user);

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError.hasError()).toEqual(false);
        expect(exportRequest).toEqual({
            includeDeletedEntries: true,
            password: 'pass',
            tables: {'Table 1': []},
        });
    });

    it('can export data without password', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError.hasError()).toEqual(false);
        expect(exportRequest).toEqual({
            includeDeletedEntries: true,
            password: '',
            tables: {'Table 1': []},
        });
    });

    it('can export data without deleted entries', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);
        await doClick(context.container, 'input[name="includeDeletedEntries"]');

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError.hasError()).toEqual(false);
        expect(exportRequest).toEqual({
            includeDeletedEntries: false,
            password: '',
            tables: {'Table 1': []},
        });
    });

    it('can download zip', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);
        apiResponse = {
            success: true,
            result: {
                zip: 'ZIP CONTENT'
            },
        };
        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError.hasError()).toEqual(false);
        const downloadButton = context.container.querySelector('a[download="export.zip"]') as HTMLAnchorElement;
        expect(downloadButton.href).toEqual('data:application/zip;base64,ZIP CONTENT');
    });

    it('can handle error during export', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);
        apiResponse = {success: false};

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError.hasError()).toEqual(false);
        expect(exportRequest).not.toBeNull();
        expect(context.container.textContent).toContain('Could not export data');
    });

    it('can close error report from export', async () => {
        await renderComponent(props);
        expect(reportedError.hasError()).toEqual(false);
        apiResponse = {success: false};
        await doClick(findButton(context.container, 'Export data'));
        expect(context.container.textContent).toContain('Could not export data');

        await doClick(findButton(context.container, 'Close'));

        expect(context.container.textContent).not.toContain('Could not export data');
    });
});