import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { INumberKeyboardProps, NumberKeyboard } from './NumberKeyboard';
import { StringMapObject, toDictionary } from '../../helpers/collections';
import {
    DELETE_SCORE_BUTTON,
    ENTER_SCORE_BUTTON,
} from '../../helpers/constants';

describe('NumberKeyboard', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let newValue: string | null;
    let enteredValue: string | null;

    async function onChange(value: string) {
        newValue = value;
    }

    async function onEnter(value: string) {
        enteredValue = value;
    }

    afterEach(async () => {
        await cleanUp(context);
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
            <NumberKeyboard {...props} />,
        );
    }

    function assertEnabledButtons(buttonText: string[]) {
        const buttons = context.all('button');
        const buttonLookup: StringMapObject = toDictionary(
            buttons,
            (b: IComponent) => b.text(),
        );

        for (const text of buttonText) {
            const button = buttonLookup[text];
            if (!button) {
                throw new Error(`Button not found: ${text}`);
            }

            expect(button.enabled()).toEqual(true);
        }
    }

    function assertDisabledButtons(buttonText: string[]) {
        const buttons = context.all('button');
        const buttonLookup: StringMapObject = toDictionary(
            buttons,
            (b: IComponent) => b.text(),
        );

        for (const text of buttonText) {
            const button = buttonLookup[text];
            if (!button) {
                throw new Error(`Button not found: ${text}`);
            }

            expect(button.enabled()).toEqual(false);
        }
    }

    describe('renders', () => {
        const allNumbers: string[] = [
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '0',
        ];

        it('when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            assertEnabledButtons(allNumbers.filter((b: string) => b !== '0'));
            assertDisabledButtons([DELETE_SCORE_BUTTON]);
        });

        it('when value is 0', async () => {
            await renderComponent({
                value: '0',
                onChange,
                onEnter,
            });

            assertEnabledButtons(
                allNumbers
                    .filter((b: string) => b !== '0')
                    .concat([DELETE_SCORE_BUTTON]),
            );
            assertDisabledButtons(['0']);
        });

        it('when value is positive', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            assertEnabledButtons(allNumbers.concat([DELETE_SCORE_BUTTON]));
        });

        it('when value is equal to max value', async () => {
            await renderComponent({
                value: '180',
                onChange,
                maxValue: 180,
                onEnter,
            });

            assertEnabledButtons([DELETE_SCORE_BUTTON]);
            assertDisabledButtons(allNumbers);
        });

        it('when value is greater than max value', async () => {
            await renderComponent({
                value: '200',
                onChange,
                maxValue: 180,
                onEnter,
            });

            assertEnabledButtons([DELETE_SCORE_BUTTON]);
            assertDisabledButtons(allNumbers);
        });

        it('when positive and 0 max value', async () => {
            await renderComponent({
                value: '10',
                onChange,
                maxValue: 0,
                onEnter,
            });

            assertEnabledButtons(allNumbers.concat([DELETE_SCORE_BUTTON]));
        });

        it('given non-number value', async () => {
            await renderComponent({
                value: 'foo',
                onChange,
                maxValue: 0,
                onEnter,
            });

            assertDisabledButtons(allNumbers);
            assertEnabledButtons([DELETE_SCORE_BUTTON]);
        });
    });

    describe('mouse interactivity', () => {
        it('can delete last digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await context.button(DELETE_SCORE_BUTTON).click();

            expect(newValue).toEqual('1');
        });

        it('can add digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await context.button('5').click();

            expect(newValue).toEqual('105');
        });

        it('cannot delete when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            expect(context.button(DELETE_SCORE_BUTTON).enabled()).toEqual(
                false,
            );
        });

        it('can add 0 when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            await context.button('0').click();

            expect(newValue).toEqual('0');
        });

        it('cannot add 0 when value is 0', async () => {
            await renderComponent({
                value: '0',
                onChange,
                onEnter,
            });

            expect(context.button('0').enabled()).toEqual(false);
        });

        it('can add 0 when preceded by other digits', async () => {
            await renderComponent({
                value: '5',
                onChange,
                onEnter,
            });

            await context.button('0').click();

            expect(newValue).toEqual('50');
        });

        it('triggers callback when enter pressed', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await context.button(ENTER_SCORE_BUTTON).click();

            expect(enteredValue).toEqual('10');
        });

        it('sends quick button value immediately', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            await context.button('140').click();

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

            expect(context.button('140').enabled()).toEqual(false);
        });
    });

    describe('keyboard interactivity', () => {
        it('can delete last digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await context.keyPress('Backspace');

            expect(newValue).toEqual('1');
        });

        it('can add digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await context.keyPress('5');

            expect(newValue).toEqual('105');
        });

        it('cannot delete when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            await context.keyPress('Backspace');

            expect(newValue).toEqual('');
        });

        it('can add 0 when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
                onEnter,
            });

            await context.keyPress('0');

            expect(newValue).toEqual('0');
        });

        it('cannot add 0 when value is 0', async () => {
            await renderComponent({
                value: '0',
                onChange,
                onEnter,
            });

            await context.keyPress('0');

            expect(newValue).toEqual('0');
        });

        it('can add 0 when preceded by other digits', async () => {
            await renderComponent({
                value: '5',
                onChange,
                onEnter,
            });

            await context.keyPress('0');

            expect(newValue).toEqual('50');
        });

        it('triggers callback when enter pressed', async () => {
            await renderComponent({
                value: '10',
                onChange,
                onEnter,
            });

            await context.keyPress('Enter');

            expect(enteredValue).toEqual('10');
        });

        it('does not change value with non-numeric key press', async () => {
            await renderComponent({
                value: '3',
                maxValue: 180,
                onChange,
                onEnter,
            });

            await context.keyPress('F');

            expect(newValue).toEqual(null);
        });

        it('does not change value when value exceeds maximum', async () => {
            await renderComponent({
                value: '19',
                maxValue: 180,
                onChange,
                onEnter,
            });

            await context.keyPress('9');

            expect(newValue).toEqual(null);
        });
    });
});
