import { AdminContainer } from './AdminContainer';
import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext,
    triggerMouseLeave,
    triggerMouseMove,
} from '../../helpers/tests';
import { ITemplateDateProps, TemplateDate } from './TemplateDate';
import { DateTemplateDto } from '../../interfaces/models/dtos/Season/Creation/DateTemplateDto';
import { FixtureTemplateDto } from '../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto';

describe('TemplateDate', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: DateTemplateDto | null;
    let deleted: boolean | null;
    let highlightedMnemonic: string | undefined;
    let deleteDatesContaining: string | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        update = null;
        deleted = null;
        highlightedMnemonic = undefined;
        deleteDatesContaining = null;
    });

    async function onUpdate(value: DateTemplateDto) {
        update = value;
    }

    async function onDelete() {
        deleted = true;
    }

    async function setHighlight(mnemonic?: string) {
        highlightedMnemonic = mnemonic;
    }

    async function deleteDates(mnemonic: string) {
        deleteDatesContaining = mnemonic;
    }

    async function renderComponent(props: ITemplateDateProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <AdminContainer tables={[]} accounts={[]}>
                <TemplateDate {...props} />
            </AdminContainer>,
        );
    }

    describe('renders', () => {
        it('empty fixtures', async () => {
            await renderComponent({
                date: {
                    fixtures: [],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            const fixtures = Array.from(
                context.container.querySelectorAll('div > button'),
            );
            expect(fixtures.map((f) => f.textContent)).toEqual([
                '🗑️',
                '⬆',
                '⬇',
            ]);
        });

        it('existing fixture', async () => {
            const fixture = {
                home: 'A',
                away: 'B',
            };
            await renderComponent({
                date: {
                    fixtures: [fixture],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            const fixtures = Array.from(
                context.container.querySelectorAll('div > button'),
            );
            expect(fixtures.map((f) => f.textContent)).toEqual([
                'A - B ×',
                '🗑️',
                '⬆',
                '⬇',
            ]);
        });

        it('existing bye', async () => {
            const fixture: FixtureTemplateDto = {
                home: 'A',
            };
            await renderComponent({
                date: {
                    fixtures: [fixture],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            const fixtures = Array.from(
                context.container.querySelectorAll('div > button'),
            );
            expect(fixtures.map((f) => f.textContent)).toEqual([
                'A ×',
                '🗑️',
                '⬆',
                '⬇',
            ]);
        });

        it('fixture with home template shared address', async () => {
            const fixture: FixtureTemplateDto = {
                home: 'A',
            };
            await renderComponent({
                date: {
                    fixtures: [fixture],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: ['A', 'B'],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            const fixtures = Array.from(
                context.container.querySelectorAll('div > button'),
            );
            const fixtureElement =
                fixtures[0].querySelector('span:first-child')!;
            expect(fixtureElement.className).toContain('bg-warning text-light');
        });

        it('fixture with home division shared address', async () => {
            const fixture: FixtureTemplateDto = {
                home: 'A',
            };
            await renderComponent({
                date: {
                    fixtures: [fixture],
                },
                divisionSharedAddresses: ['A', 'B'],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            const fixtures = Array.from(
                context.container.querySelectorAll('div > button'),
            );
            const fixtureElement =
                fixtures[0].querySelector('span:first-child')!;
            expect(fixtureElement.className).toContain(
                'bg-secondary text-light',
            );
        });

        it('fixture with home division and template shared address', async () => {
            const fixture: FixtureTemplateDto = {
                home: 'A',
            };
            await renderComponent({
                date: {
                    fixtures: [fixture],
                },
                divisionSharedAddresses: ['A', 'B'],
                templateSharedAddresses: ['A', 'B'],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            const fixtures = Array.from(
                context.container.querySelectorAll('div > button'),
            );
            const fixtureElement =
                fixtures[0].querySelector('span:first-child')!;
            expect(fixtureElement.className).toContain(
                'bg-secondary text-light',
            );
        });

        it('highlights home mnemonic', async () => {
            const fixture: FixtureTemplateDto = {
                home: 'A',
            };
            await renderComponent({
                date: {
                    fixtures: [fixture],
                },
                divisionSharedAddresses: ['A', 'B'],
                templateSharedAddresses: ['A', 'B'],
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
                deleteDates,
            });

            const fixtures = Array.from(
                context.container.querySelectorAll('div > button'),
            );
            const fixtureElement =
                fixtures[0].querySelector('span:first-child')!;
            expect(fixtureElement.className).toContain('bg-danger');
        });

        it('highlights away mnemonic', async () => {
            const fixture = {
                home: 'A',
                away: 'B',
            };
            await renderComponent({
                date: {
                    fixtures: [fixture],
                },
                divisionSharedAddresses: ['A', 'B'],
                templateSharedAddresses: ['A', 'B'],
                onUpdate,
                onDelete,
                highlight: 'B',
                setHighlight,
                deleteDates,
            });

            const fixtures = Array.from(
                context.container.querySelectorAll('div > button'),
            );
            const fixtureElement =
                fixtures[0].querySelector('span:nth-child(3)')!;
            expect(fixtureElement.className).toContain('bg-danger');
        });
    });

    describe('interactivity', () => {
        it('can add league fixture (Button press)', async () => {
            await renderComponent({
                date: {
                    fixtures: [],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await doChange(
                context.container,
                'input[name="home"]',
                'A',
                context.user,
            );
            await doChange(
                context.container,
                'input[name="away"]',
                'B',
                context.user,
            );
            await doClick(findButton(context.container, '➕'));

            expect(update).toEqual({
                fixtures: [
                    {
                        home: 'A',
                        away: 'B',
                    },
                ],
            });
        });

        it('can add league fixture (Enter key press)', async () => {
            await renderComponent({
                date: {
                    fixtures: [],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await doChange(
                context.container,
                'input[name="home"]',
                'A',
                context.user,
            );
            await doChange(
                context.container,
                'input[name="away"]',
                'B',
                context.user,
            );
            await context.user!.type(
                context.container.querySelector('input[name="away"]')!,
                '{Enter}',
            );

            expect(update).toEqual({
                fixtures: [
                    {
                        home: 'A',
                        away: 'B',
                    },
                ],
            });
        });

        it('cannot add fixture without a home team (Button press)', async () => {
            await renderComponent({
                date: {
                    fixtures: [],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await doChange(
                context.container,
                'input[name="home"]',
                'A',
                context.user,
            );
            await doChange(
                context.container,
                'input[name="home"]',
                '',
                context.user,
            );
            await doChange(
                context.container,
                'input[name="away"]',
                'B',
                context.user,
            );
            await doClick(findButton(context.container, '➕'));

            context.prompts.alertWasShown('Enter at least a home team');
            expect(update).toBeNull();
        });

        it('cannot add fixture without a home team (Enter key press)', async () => {
            await renderComponent({
                date: {
                    fixtures: [],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await doChange(
                context.container,
                'input[name="home"]',
                'A',
                context.user,
            );
            await doChange(
                context.container,
                'input[name="home"]',
                '',
                context.user,
            );
            await doChange(
                context.container,
                'input[name="away"]',
                'B',
                context.user,
            );
            await context.user!.type(
                context.container.querySelector('input[name="home"]')!,
                '{Enter}',
            );

            context.prompts.alertWasShown('Enter at least a home team');
            expect(update).toBeNull();
        });

        it('can add bye fixture', async () => {
            await renderComponent({
                date: {
                    fixtures: [],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await doChange(
                context.container,
                'input[name="home"]',
                'A',
                context.user,
            );
            await doClick(findButton(context.container, '➕'));

            expect(update).toEqual({
                fixtures: [
                    {
                        home: 'A',
                    },
                ],
            });
        });

        it('can delete league fixture', async () => {
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await doClick(findButton(context.container, 'A - B ×'));

            expect(update).toEqual({
                fixtures: [],
            });
        });

        it('can delete bye fixture', async () => {
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await doClick(findButton(context.container, 'A ×'));

            expect(update).toEqual({
                fixtures: [],
            });
        });

        it('can delete date with fixtures', async () => {
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await doClick(findButton(context.container, '🗑️'));

            expect(deleted).toEqual(true);
        });

        it('can set highlight to home', async () => {
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await triggerMouseMove(
                context.container.querySelector(
                    'button.badge > span:first-child',
                )!,
                true,
            );

            expect(highlightedMnemonic).toEqual('A');
        });

        it('can set highlight to away', async () => {
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: '',
                setHighlight,
                deleteDates,
            });

            await triggerMouseMove(
                context.container.querySelector(
                    'button.badge > span:nth-child(3)',
                )!,
                true,
            );

            expect(highlightedMnemonic).toEqual('B');
        });

        it('removes highlight when mouse leaves', async () => {
            highlightedMnemonic = 'A';
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
                deleteDates,
            });

            await triggerMouseLeave(
                context.container.querySelector(
                    'button.badge > span:first-child',
                )!,
                true,
            );

            expect(highlightedMnemonic).toBeUndefined();
        });

        it('removes highlight when mouse moves and ctrl not pressed', async () => {
            highlightedMnemonic = 'A';
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
                deleteDates,
            });

            await triggerMouseMove(
                context.container.querySelector(
                    'button.badge > span:first-child',
                )!,
                false,
            );

            expect(highlightedMnemonic).toBeUndefined();
        });

        it('can delete all fixtures for the home mnemonic', async () => {
            highlightedMnemonic = 'A';
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: 'A',
                setHighlight,
                deleteDates,
            });
            context.prompts.respondToConfirm(
                'Are you sure you want to delete all fixtures where A are playing?',
                true,
            );

            await doClick(findButton(context.container, 'A - B ×'));

            expect(update).toBeNull();
            expect(deleteDatesContaining).toEqual('A');
            expect(highlightedMnemonic).toBeUndefined();
        });

        it('can delete all fixtures for the away mnemonic', async () => {
            highlightedMnemonic = 'B';
            await renderComponent({
                date: {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                highlight: 'B',
                setHighlight,
                deleteDates,
            });
            context.prompts.respondToConfirm(
                'Are you sure you want to delete all fixtures where B are playing?',
                true,
            );

            await doClick(findButton(context.container, 'A - B ×'));

            expect(update).toBeNull();
            expect(deleteDatesContaining).toEqual('B');
            expect(highlightedMnemonic).toBeUndefined();
        });
    });
});
