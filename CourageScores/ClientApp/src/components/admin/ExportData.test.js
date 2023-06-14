// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {renderApp, cleanUp, doClick, doChange, findButton} from "../../helpers/tests";
import {ExportData} from "./ExportData";

describe('ExportData', () => {
    let context;
    let reportedError;
    let exportRequest;
    let apiResponse;
    const dataApi = {
        export: async (request) => {
            exportRequest = request;
            return apiResponse || { success: true, result: { zip: '' } };
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(adminProps) {
        reportedError = null;
        apiResponse = null;
        exportRequest = null;
        context = await renderApp(
            { dataApi },
            {
                account: {},
                appLoading: false,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<AdminContainer {...adminProps}>
                <ExportData />
            </AdminContainer>));
    }

    it('renders tables', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });

        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        expect(tables.map(t => t.textContent)).toEqual([ 'Table 1', 'Table 2' ]);
    });

    it('can select exportable table', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        expect(table1).toBeTruthy();
        expect(table1.className).not.toContain('active');

        await doClick(table1);

        expect(table1.className).toContain('active');
    });

    it('cannot select non-exportable table', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table2 = tables.filter(t => t.textContent.indexOf('Table 2') !== -1)[0];
        expect(table2).toBeTruthy();
        expect(table2.className).not.toContain('active');

        await doClick(table2);

        expect(table2.className).not.toContain('active');
    });

    it('cannot export when no tables selected', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });
        expect(reportedError).toBeNull();
        let alert;
        window.alert = (msg) => alert = msg;

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError).toBeNull();
        expect(exportRequest).toBeNull();
        expect(alert).toEqual('Select some tables to export');
    });

    it('can export data with password', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        await doClick(table1); // select table 1
        await doChange(context.container, 'input[name="password"]', 'pass', context.user);

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError).toBeNull();
        expect(exportRequest).toEqual({
            includeDeletedEntries: true,
            password: 'pass',
            tables: [ 'Table 1' ],
        });
    });

    it('can export data without password', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        await doClick(table1); // select table 1

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError).toBeNull();
        expect(exportRequest).toEqual({
            includeDeletedEntries: true,
            password: '',
            tables: [ 'Table 1' ],
        });
    });

    it('can export data without deleted entries', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        await doClick(table1); // select table 1
        await doClick(context.container, 'input[name="includeDeletedEntries"]');

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError).toBeNull();
        expect(exportRequest).toEqual({
            includeDeletedEntries: false,
            password: '',
            tables: [ 'Table 1' ],
        });
    });

    it('can download zip', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        await doClick(table1); // select table 1
        apiResponse = {
            success: true,
            result: {
                zip: 'ZIP CONTENT'
            },
        };
        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError).toBeNull();
        const downloadButton = context.container.querySelector('a[download="export.zip"]');
        expect(downloadButton.href).toEqual('data:application/zip;base64,ZIP CONTENT');
    });

    it('can handle error during export', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canExport: true },
                { name: 'Table 2', canExport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        await doClick(table1); // select table 1
        apiResponse = { success: false };

        await doClick(findButton(context.container, 'Export data'));

        expect(reportedError).toBeNull();
        expect(exportRequest).not.toBeNull();
        expect(context.container.textContent).toContain('Could not export data');
    });
});