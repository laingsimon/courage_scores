// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {renderApp, cleanUp, doClick, doChange, findButton, setFile} from "../../helpers/tests";
import {ImportData} from "./ImportData";

describe('ImportData', () => {
    let context;
    let reportedError;
    let importRequest;
    let apiResponse;
    const dataApi = {
        import: async (request) => {
            importRequest = request;
            return apiResponse || { success: true, result: { tables: [] }, errors: [], warnings: [], messages: [] };
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(adminProps) {
        reportedError = null;
        apiResponse = null;
        importRequest = null;
        context = await renderApp(
            { dataApi },
            { name: 'Courage Scores' },
            {
                account: { },
                appLoading: false,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                reportClientSideException: () => { },
            },
            (<AdminContainer {...adminProps}>
                <ImportData />
            </AdminContainer>));
    }

    async function setFileToImport() {
        const file = 'some content';
        await setFile(context.container, 'input[type="file"]', file, context.user);
    }

    it('renders tables', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });

        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        expect(tables.map(t => t.textContent)).toEqual([ 'Table 1', 'Table 2' ]);
    });

    it('can select importable table', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        expect(table1).toBeTruthy();
        expect(table1.className).toContain('active');

        await doClick(table1);

        expect(table1.className).not.toContain('active');
    });

    it('cannot select non-importable table', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
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

    it('cannot import when no file selected', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        let alert;
        window.alert = (msg) => alert = msg;

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).toBeNull();
        expect(alert).toEqual('Select a file first');
    });

    it('cannot import when no tables selected', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        let alert;
        window.alert = (msg) => alert = msg;
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') !== -1) {
            await doClick(table1);
        }
        await setFileToImport();

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).toBeNull();
        expect(alert).toEqual('Select some tables to import');
    });

    it('can import data with password', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') === -1) {
            await doClick(table1);
        }
        await doChange(context.container, 'input[name="password"]', 'pass', context.user);
        await setFileToImport();

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).toEqual({
            dryRun: true,
            purgeData: false,
            password: 'pass',
            tables: [ 'Table 1' ],
        });
    });

    it('can import data without password', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') === -1) {
            await doClick(table1);
        }
        await setFileToImport();

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).toEqual({
            dryRun: true,
            purgeData: false,
            password: '',
            tables: [ 'Table 1' ],
        });
    });

    it('can import data with purge and commit', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') === -1) {
            await doClick(table1);
        }
        await doClick(context.container, 'input[name="purgeData"]');
        await doClick(context.container, 'input[name="dryRun"]');
        await setFileToImport();

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).toEqual({
            dryRun: false,
            purgeData: true,
            password: '',
            tables: [ 'Table 1' ],
        });
    });

    it('renders import results', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') === -1) {
            await doClick(table1);
        }
        await setFileToImport();
        apiResponse = {
            success: true,
            result: {
                tables: {
                    'Table 1': 5
                }
            },
            errors: [ 'some_error' ],
            warnings: [ 'some_warning' ],
            messages: [ 'some_message' ],
        };

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(context.container.textContent).toContain('Table 1: 5 row/s imported');
        expect(context.container.textContent).toContain('some_error');
        expect(context.container.textContent).toContain('some_warning');
        expect(context.container.textContent).toContain('some_message');
    });

    it('can handle error during import', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') === -1) {
            await doClick(table1);
        }
        await setFileToImport();
        apiResponse = { success: false };

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).not.toBeNull();
        expect(context.container.textContent).toContain('Could not import data');
    });

    it('can handle http 500 error during import', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') === -1) {
            await doClick(table1);
        }
        await setFileToImport();
        apiResponse = {
            status: 500,
            body: { },
            text: async () => 'some text error',
        };

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).not.toBeNull();
        expect(context.container.textContent).toContain('Could not import data');
    });

    it('can handle http 400 error during import', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') === -1) {
            await doClick(table1);
        }
        await setFileToImport();
        apiResponse = {
            status: 400,
            body: { },
            json: async () => { return { errors: [ 'some error' ] }; },
        };

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).not.toBeNull();
        expect(context.container.textContent).toContain('Could not import data');
    });

    it('can handle unexpected error during import', async () => {
        await renderComponent({
            tables: [
                { name: 'Table 1', canImport: true },
                { name: 'Table 2', canImport: false }
            ]
        });
        expect(reportedError).toBeNull();
        const tables = Array.from(context.container.querySelectorAll('ul li'));
        const table1 = tables.filter(t => t.textContent.indexOf('Table 1') !== -1)[0];
        if (table1.className.indexOf('active') === -1) {
            await doClick(table1);
        }
        await setFileToImport();
        apiResponse = {
            status: 400,
            body: { },
            json: async () => { throw new Error('some error'); },
        };
        console.error = () => { };

        await doClick(findButton(context.container, 'Import data'));

        expect(reportedError).toBeNull();
        expect(importRequest).not.toBeNull();
        expect(context.container.textContent).toContain('Could not import data');
    });
});