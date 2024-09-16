import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {ITableSelectionProps, TableSelection} from "./TableSelection";
import {TableDto} from "../../interfaces/models/dtos/Data/TableDto";

describe('TableSelection', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let tableChanged: string[];

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        tableChanged = null;
    });

    async function onTableChange(value: string[]) {
        tableChanged = value;
    }

    async function renderComponent(props: ITableSelectionProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<TableSelection {...props} />));
    }

    const tableA: TableDto = {
        name: 'A',
        canImport: true,
        canExport: true,
        environmentalName: '',
        partitionKey: '',
    };
    const tableB: TableDto = {
        name: 'B',
        canImport: true,
        canExport: true,
        environmentalName: '',
        partitionKey: '',
    };
    const tableC: TableDto = {
        name: 'C',
        canImport: false,
        canExport: false,
        environmentalName: '',
        partitionKey: '',
    };

    it('sorts table by name', async () => {
        await renderComponent({
            allTables: [tableB, tableA],
            selected: [tableA.name],
            requireCanExport: false,
            requireCanImport: false,
            onTableChange,
        });

        const items = Array.from(context.container.querySelectorAll('li'));
        const itemText = items.map(i => i.textContent);
        expect(itemText).toEqual(['A', 'B']);
    });

    it('renders selected tables', async () => {
        await renderComponent({
            allTables: [tableB, tableA],
            selected: [tableA.name],
            requireCanExport: false,
            requireCanImport: false,
            onTableChange,
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
            onTableChange,
        });

        const items = Array.from(context.container.querySelectorAll('li'));
        expect(items[0].textContent).toEqual('Loading tables...');
    });

    it('can select table', async () => {
        await renderComponent({
            allTables: [tableB, tableA],
            selected: [],
            requireCanExport: false,
            requireCanImport: false,
            onTableChange,
        });
        const items = Array.from(context.container.querySelectorAll('li'));

        await doClick(items[0]);

        expect(tableChanged).toEqual(['A']);
    });

    it('can deselect table', async () => {
        await renderComponent({
            allTables: [tableB, tableA],
            selected: [tableA.name, tableB.name],
            requireCanExport: false,
            requireCanImport: false,
            onTableChange,
        });
        const items = Array.from(context.container.querySelectorAll('li'));

        await doClick(items[0]);

        expect(tableChanged).toEqual(['B']);
    });

    it('cannot select table that cannot be imported', async () => {
        await renderComponent({
            allTables: [tableC],
            selected: [],
            requireCanExport: false,
            requireCanImport: true,
            onTableChange,
        });
        const items = Array.from(context.container.querySelectorAll('li'));

        await doClick(items[0]);

        expect(tableChanged).toBeNull();
    });

    it('cannot select table that cannot be exported', async () => {
        await renderComponent({
            allTables: [tableC],
            selected: [],
            requireCanExport: true,
            requireCanImport: false,
            onTableChange,
        });
        const items = Array.from(context.container.querySelectorAll('li'));

        await doClick(items[0]);

        expect(tableChanged).toBeNull();
    });
});