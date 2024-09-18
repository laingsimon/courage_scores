import {AdminContainer} from "./AdminContainer";
import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    findButton,
    iocProps,
    renderApp,
    TestContext, triggerMouseLeave, triggerMouseMove
} from "../../helpers/tests";
import {ISharedAddressProps, SharedAddress} from "./SharedAddress";

describe('SharedAddress', () => {
    let context: TestContext;
    let updatedAddresses: string[];
    let deleted: boolean;
    let highlightedMnemonic: string;

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
        highlightedMnemonic = null;
    });

    async function renderComponent(props: ISharedAddressProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<AdminContainer tables={[]} accounts={[]}>
                <SharedAddress {...props} />
            </AdminContainer>));
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

            const addressBadges = Array.from(context.container.querySelectorAll('button.badge')) as HTMLButtonElement[];
            expect(addressBadges).toEqual([]);
            const newAddressBadge = context.container.querySelector('span.badge');
            expect(newAddressBadge).toBeTruthy();
        });

        it('single address item', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            const addressBadges = Array.from(context.container.querySelectorAll('button.badge')) as HTMLButtonElement[];
            expect(addressBadges.map(b => b.textContent)).toEqual([ 'A ×' ]);
            const newAddressBadge = context.container.querySelector('span.badge');
            expect(newAddressBadge).toBeTruthy();
        });

        it('multiple address items', async () => {
            await renderComponent({
                address: [ 'A', 'B' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            const addressBadges = Array.from(context.container.querySelectorAll('button.badge')) as HTMLButtonElement[];
            expect(addressBadges.map(b => b.textContent)).toEqual([ 'A ×', 'B ×' ]);
        });

        it('with correct className', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            const addressBadges = Array.from(context.container.querySelectorAll('button.badge')) as HTMLButtonElement[];
            expect(addressBadges.map(b => b.className.indexOf(' bg-warning') !== -1)).toEqual([ true ]);
            const newAddressBadge = context.container.querySelector('span.badge');
            expect(newAddressBadge.className).toContain(' bg-warning');
        });

        it('with highlight', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
            });

            const newAddressBadge = context.container.querySelector('button.badge');
            expect(newAddressBadge.className).toContain(' bg-danger');
        });
    });

    describe('interactivity', () => {
        it('can add address', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await doChange(context.container, 'input', 'B', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(updatedAddresses).toEqual(['A', 'B']);
        });

        it('adds address when enter is pressed', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await doChange(context.container, 'input', 'B', context.user);
            await context.user.type(context.container.querySelector('input'), '{Enter}');

            expect(updatedAddresses).toEqual(['A', 'B']);
        });

        it('new address code is reset to empty when address has been added', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await doChange(context.container, 'input', 'B', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(context.container.querySelector('input').value).toEqual('');
        });

        it('cannot add address with empty code (Button click)', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });
            let alert: string;
            window.alert = (msg) => alert = msg;

            await doChange(context.container, 'input', '', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(alert).toEqual('Enter a code for the team');
        });

        it('cannot add address with empty code (Enter key press)', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });
            let alert: string;
            window.alert = (msg) => alert = msg;

            await doChange(context.container, 'input', '', context.user);
            await context.user.type(context.container.querySelector('input'), '{Enter}');

            expect(alert).toEqual('Enter a code for the team');
        });

        it('can remove address', async () => {
            await renderComponent({
                address: [ 'A', 'B' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await doClick(findButton(context.container, 'B ×'));

            expect(updatedAddresses).toEqual(['A']);
        });

        it('can remove last address', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await doClick(findButton(context.container, 'A ×'));

            expect(updatedAddresses).toEqual([]);
        });

        it('can delete shared address', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await doClick(findButton(context.container, '🗑️ Remove'));

            expect(deleted).toEqual(true);
        });

        it('sets highlight', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
            });

            await triggerMouseMove(context.container.querySelector('button.badge'), true);

            expect(highlightedMnemonic).toEqual('A');
        });

        it('removes highlight when mouse leaves', async () => {
            highlightedMnemonic = 'A';
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
            });

            await triggerMouseLeave(context.container.querySelector('button.badge'), true);

            expect(highlightedMnemonic).toBeNull();
        });

        it('removes highlight when mouse moves and ctrl not pressed', async () => {
            highlightedMnemonic = 'A';
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
            });

            await triggerMouseMove(context.container.querySelector('button.badge'), false);

            expect(highlightedMnemonic).toBeNull();
        });
    });
});