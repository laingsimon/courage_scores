import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { ITableSelectionProps, TableSelection } from './TableSelection';
import { TableDto } from '../../interfaces/models/dtos/Data/TableDto';

describe('TableSelection', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let tableChanged: string[] | null;

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
            <TableSelection {...props} />,
        );
    }

    const tableA: TableDto = {
        name: 'A',
        canImport: true,
        canExport: true,
        partitionKey: '',
    };
    const tableB: TableDto = {
        name: 'B',
        canImport: true,
        canExport: true,
        partitionKey: '',
    };
    const tableC: TableDto = {
        name: 'C',
        canImport: false,
        canExport: false,
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

        const items = context.all('li');
        const itemText = items.map((i) => i.text());
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

        const items = context.all('li');
        expect(items[0].className()).toContain('active');
    });

    it('renders tables loading', async () => {
        await renderComponent({
            selected: [],
            requireCanExport: false,
            requireCanImport: false,
            onTableChange,
        });

        const items = context.all('li');
        expect(items[0].text()).toEqual('Loading tables...');
    });

    it('can select table', async () => {
        await renderComponent({
            allTables: [tableB, tableA],
            selected: [],
            requireCanExport: false,
            requireCanImport: false,
            onTableChange,
        });
        const items = context.all('li');

        await items[0].click();

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
        const items = context.all('li');

        await items[0].click();

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
        const items = context.all('li');

        await items[0].click();

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
        const items = context.all('li');

        await items[0].click();

        expect(tableChanged).toBeNull();
    });
});
