// noinspection JSUnresolvedFunction

import {cleanUp, doClick, renderApp} from "../../helpers/tests";
import React from "react";
import {TableSelection} from "./TableSelection";

describe('TableSelection', () => {
    let context;
    let reportedError;
    let tableChanged;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        reportedError = null;
        tableChanged = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<TableSelection {...props} onTableChange={(value) => tableChanged = value}/>));
    }

    it('sorts table by name', async () => {
        const tableA = {
            name: 'A',
            canImport: true,
            canExport: true,
        };
        const tableB = {
            name: 'B',
            canImport: true,
            canExport: true,
        };

        await renderComponent({
            allTables: [tableB, tableA],
            selected: [tableA.name],
            requireCanExport: false,
            requireCanImport: false,
        });

        const items = Array.from(context.container.querySelectorAll('li'));
        const itemText = items.map(i => i.textContent);
        expect(itemText).toEqual(['A', 'B']);
    });

    it('renders selected tables', async () => {
        const tableA = {
            name: 'A',
            canImport: true,
            canExport: true,
        };
        const tableB = {
            name: 'B',
            canImport: true,
            canExport: true,
        };

        await renderComponent({
            allTables: [tableB, tableA],
            selected: [tableA.name],
            requireCanExport: false,
            requireCanImport: false,
        });

        const items = Array.from(context.container.querySelectorAll('li'));
        expect(items[0].className).toContain('active');
    });

    it('renders tables loading', async () => {
        await renderComponent({
            allTables: null,
            selected: [],
            requireCanExport: false,
            requireCanImport: false,
        });

        const items = Array.from(context.container.querySelectorAll('li'));
        expect(items[0].textContent).toEqual('Loading tables...');
    });

    it('can select table', async () => {
        const tableA = {
            name: 'A',
            canImport: true,
            canExport: true,
        };
        const tableB = {
            name: 'B',
            canImport: true,
            canExport: true,
        };
        await renderComponent({
            allTables: [tableB, tableA],
            selected: [],
            requireCanExport: false,
            requireCanImport: false,
        });
        const items = Array.from(context.container.querySelectorAll('li'));

        await doClick(items[0]);

        expect(tableChanged).toEqual(['A']);
    });

    it('can deselect table', async () => {
        const tableA = {
            name: 'A',
            canImport: true,
            canExport: true,
        };
        const tableB = {
            name: 'B',
            canImport: true,
            canExport: true,
        };
        await renderComponent({
            allTables: [tableB, tableA],
            selected: [tableA.name, tableB.name],
            requireCanExport: false,
            requireCanImport: false,
        });
        const items = Array.from(context.container.querySelectorAll('li'));

        await doClick(items[0]);

        expect(tableChanged).toEqual(['B']);
    });

    it('cannot select table that cannot be imported', async () => {
        const tableA = {
            name: 'A',
            canImport: false,
            canExport: false,
        };
        await renderComponent({
            allTables: [tableA],
            selected: [],
            requireCanExport: false,
            requireCanImport: true,
        });
        const items = Array.from(context.container.querySelectorAll('li'));

        await doClick(items[0]);

        expect(tableChanged).toBeNull();
    });

    it('cannot select table that cannot be exported', async () => {
        const tableA = {
            name: 'A',
            canImport: false,
            canExport: false,
        };
        await renderComponent({
            allTables: [tableA],
            selected: [],
            requireCanExport: true,
            requireCanImport: false,
        });
        const items = Array.from(context.container.querySelectorAll('li'));

        await doClick(items[0]);

        expect(tableChanged).toBeNull();
    });
});