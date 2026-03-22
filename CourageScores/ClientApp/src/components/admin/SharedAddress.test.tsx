import { AdminContainer } from './AdminContainer';
import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { ISharedAddressProps, SharedAddress } from './SharedAddress';

describe('SharedAddress', () => {
    let context: TestContext;
    let updatedAddresses: string[] | null;
    let deleted: boolean;
    let highlightedMnemonic: string | undefined;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function onUpdate(addresses: string[]) {
        updatedAddresses = addresses;
    }

    async function onDelete() {
        deleted = true;
    }

    async function setHighlight(mnemonic?: string) {
        highlightedMnemonic = mnemonic;
    }

    beforeEach(() => {
        updatedAddresses = null;
        deleted = false;
        highlightedMnemonic = undefined;
    });

    async function renderComponent(props: ISharedAddressProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <AdminContainer tables={[]} accounts={[]}>
                <SharedAddress {...props} />
            </AdminContainer>,
        );
    }

    describe('renders', () => {
        it('empty address list', async () => {
            await renderComponent({
                address: [],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            const addressBadges = context.all('button.badge');
            expect(addressBadges).toEqual([]);
            context.required('span.badge');
        });

        it('single address item', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            const addressBadges = context.all('button.badge');
            expect(addressBadges.map((b) => b.text())).toEqual(['A ×']);
            context.required('span.badge');
        });

        it('multiple address items', async () => {
            await renderComponent({
                address: ['A', 'B'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            const addressBadges = context.all('button.badge');
            expect(addressBadges.map((b) => b.text())).toEqual(['A ×', 'B ×']);
        });

        it('with correct className', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            const addressBadges = context.all('button.badge');
            expect(
                addressBadges.map(
                    (b) => b.className().indexOf(' bg-warning') !== -1,
                ),
            ).toEqual([true]);
            const newAddressBadge = context.required('span.badge');
            expect(newAddressBadge.className()).toContain(' bg-warning');
        });

        it('with highlight', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
            });

            const newAddressBadge = context.required('button.badge');
            expect(newAddressBadge.className()).toContain(' bg-danger');
        });
    });

    describe('interactivity', () => {
        it('can add address', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.input('sharedAddress').change('B');
            await context.button('➕').click();

            expect(updatedAddresses).toEqual(['A', 'B']);
        });

        it('adds address when enter is pressed', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.input('sharedAddress').change('B');
            await context.input('sharedAddress').type('{Enter}');

            expect(updatedAddresses).toEqual(['A', 'B']);
        });

        it('new address code is reset to empty when address has been added', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.input('sharedAddress').change('B');
            await context.button('➕').click();

            expect(context.input('sharedAddress').value()).toEqual('');
        });

        it('cannot add address with empty code (Button click)', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.input('sharedAddress').change('');
            await context.button('➕').click();

            context.prompts.alertWasShown('Enter a code for the team');
        });

        it('cannot add address with empty code (Enter key press)', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.input('sharedAddress').change('');
            await context.input('sharedAddress').type('{Enter}');

            context.prompts.alertWasShown('Enter a code for the team');
        });

        it('can remove address', async () => {
            await renderComponent({
                address: ['A', 'B'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.button('B ×').click();

            expect(updatedAddresses).toEqual(['A']);
        });

        it('can remove last address', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.button('A ×').click();

            expect(updatedAddresses).toEqual([]);
        });

        it('can delete shared address', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.button('🗑️ Remove').click();

            expect(deleted).toEqual(true);
        });

        it('sets highlight', async () => {
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await context.required('button.badge').mouseMove(true);

            expect(highlightedMnemonic).toEqual('A');
        });

        it('removes highlight when mouse leaves', async () => {
            highlightedMnemonic = 'A';
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
            });

            await context.required('button.badge').mouseLeave(true);

            expect(highlightedMnemonic).toBeUndefined();
        });

        it('removes highlight when mouse moves and ctrl not pressed', async () => {
            highlightedMnemonic = 'A';
            await renderComponent({
                address: ['A'],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
            });

            await context.required('button.badge').mouseMove();

            expect(highlightedMnemonic).toBeUndefined();
        });
    });
});
