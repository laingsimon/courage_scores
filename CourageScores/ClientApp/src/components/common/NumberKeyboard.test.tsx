import {
    appProps,
    brandingProps,
    cleanUp, doClick, doKeyPress,
    ErrorState, findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {INumberKeyboardProps, NumberKeyboard} from "./NumberKeyboard";
import {StringMapObject, toDictionary} from "../../helpers/collections";
import {DELETE_SCORE_BUTTON, ENTER_SCORE_BUTTON} from "../../helpers/constants";

describe('NumberKeyboard', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let newValue: string;
    let enteredValue: string;

    async function onChange(value: string) {
        newValue = value;
    }

    async function onEnter(value: string) {
        enteredValue = value;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        newValue = null;
        enteredValue = null;
    });

    async function renderComponent(props: INumberKeyboardProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<NumberKeyboard {...props} />));
    }

    function assertEnabledButtons(buttonText: string[]) {
        const buttons: HTMLButtonElement[] = Array.from(context.container.querySelectorAll('button'));
        const buttonLookup: StringMapObject = toDictionary(buttons, (b: HTMLButtonElement) => b.textContent);

        for (let text of buttonText) {
            const button = buttonLookup[text];
            if (!button) {
                throw new Error(`Button not found: ${text}`);
            }

            expect(button.disabled).toEqual(false);
        }
    }

    function assertDisabledButtons(buttonText: string[]) {
        const buttons: HTMLButtonElement[] = Array.from(context.container.querySelectorAll('button'));
        const buttonLookup: StringMapObject = toDictionary(buttons, (b: HTMLButtonElement) => b.textContent);

        for (let text of buttonText) {
            const button = buttonLookup[text];
            if (!button) {
                throw new Error(`Button not found: ${text}`);
            }

            expect(button.disabled).toEqual(true);
        }
    }

    describe('renders', () => {
        const allNumbers: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

        it('when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            assertEnabledButtons(allNumbers.filter((b: string) => b !== '0'));
            assertDisabledButtons([ DELETE_SCORE_BUTTON ]);
        });

        it('when value is 0', async () => {
            await renderComponent({
                value: '0',
                onChange,
                onEnter,
            });

            assertEnabledButtons(allNumbers.filter((b: string) => b !== '0').concat([ DELETE_SCORE_BUTTON ]));
            assertDisabledButtons([ '0' ]);
        });

        it('when value is positive', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            assertEnabledButtons(allNumbers.concat([ DELETE_SCORE_BUTTON ]));
        });

        it('when value is equal to max value', async () => {
            await renderComponent({
                value: '180',
                onChange,
                maxValue: 180,
                onEnter,
            });

            assertEnabledButtons([ DELETE_SCORE_BUTTON ]);
            assertDisabledButtons(allNumbers);
        });

        it('when value is greater than max value', async () => {
            await renderComponent({
                value: '200',
                onChange,
                maxValue: 180,
                onEnter,
            });

            assertEnabledButtons([ DELETE_SCORE_BUTTON ]);
            assertDisabledButtons(allNumbers);
        });

        it('when positive and 0 max value', async () => {
            await renderComponent({
                value: '10',
                onChange,
                maxValue: 0,
                onEnter,
            });

            assertEnabledButtons(allNumbers.concat([ DELETE_SCORE_BUTTON ]));
        });

        it('given non-number value', async () => {
            await renderComponent({
                value: 'foo',
                onChange,
                maxValue: 0,
                onEnter,
            });

            assertDisabledButtons(allNumbers);
            assertEnabledButtons([ DELETE_SCORE_BUTTON ]);
        });
    });

    describe('mouse interactivity', () => {
        it('can delete last digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await doClick(findButton(context.container, DELETE_SCORE_BUTTON));

            expect(newValue).toEqual('1');
        });

        it('can add digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await doClick(findButton(context.container, '5'));

            expect(newValue).toEqual('105');
        });

        it('cannot delete when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            const zeroButton: HTMLButtonElement = findButton(context.container, DELETE_SCORE_BUTTON);
            expect(zeroButton.disabled).toEqual(true);
        });

        it('can add 0 when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            await doClick(findButton(context.container, '0'));

            expect(newValue).toEqual('0');
        });

        it('cannot add 0 when value is 0', async () => {
            await renderComponent({
                value: '0',
                onChange,
                onEnter,
            });

            const zeroButton: HTMLButtonElement = findButton(context.container, '0');
            expect(zeroButton.disabled).toEqual(true);
        });

        it('can add 0 when preceded by other digits', async () => {
            await renderComponent({
                value: '5',
                onChange,
                onEnter,
            });

            await doClick(findButton(context.container, '0'));

            expect(newValue).toEqual('50');
        });

        it('triggers callback when enter pressed', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await doClick(findButton(context.container, ENTER_SCORE_BUTTON));

            expect(enteredValue).toEqual('10');
        });

        it('sends quick button value immediately', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            await doClick(findButton(context.container, '140'));

            expect(enteredValue).toEqual('140');
            expect(newValue).toEqual(null);
        });

        it('cannot click quick button when value entered', async () => {
            await renderComponent({
                value: '3',
                maxValue: 180,
                onChange,
                onEnter,
            });

            const oneFourtyQuickButton: HTMLButtonElement = findButton(context.container, '140');
            expect(oneFourtyQuickButton.disabled).toEqual(true);
        });
    });

    describe('keyboard interactivity', () => {
        it('can delete last digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, 'Backspace');

            expect(newValue).toEqual('1');
        });

        it('can add digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, '5');

            expect(newValue).toEqual('105');
        });

        it('cannot delete when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, 'Backspace');

            expect(newValue).toEqual('');
        });

        it('can add 0 when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, '0');

            expect(newValue).toEqual('0');
        });

        it('cannot add 0 when value is 0', async () => {
            await renderComponent({
                value: '0',
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, '0');

            expect(newValue).toEqual('0');
        });

        it('can add 0 when preceded by other digits', async () => {
            await renderComponent({
                value: '5',
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, '0');

            expect(newValue).toEqual('50');
        });

        it('triggers callback when enter pressed', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, 'Enter');

            expect(enteredValue).toEqual('10');
        });

        it('does not change value with non-numeric key press', async () => {
            await renderComponent({
                value: '3',
                maxValue: 180,
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, 'F');

            expect(newValue).toEqual(null);
        });

        it('does not change value when value exceeds maximum', async () => {
            await renderComponent({
                value: '19',
                maxValue: 180,
                onChange,
                onEnter,
            });

            await doKeyPress(context.container, '9');

            expect(newValue).toEqual(null);
        });
    });
});