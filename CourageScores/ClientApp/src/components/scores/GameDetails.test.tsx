import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { GameDetails, IGameDetailsProps } from './GameDetails';
import { fixtureBuilder } from '../../helpers/builders/games';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { seasonBuilder } from '../../helpers/builders/seasons';

describe('GameDetails', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedFixtureData: GameDto | null;

    async function setFixtureData(newFixtureData: GameDto) {
        updatedFixtureData = newFixtureData;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedFixtureData = null;
    });

    async function renderComponent(props: IGameDetailsProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <GameDetails {...props} />,
        );
    }

    describe('when not logged in', () => {
        const season = seasonBuilder()
            .starting('2023-04-01')
            .ending('2024-04-08')
            .build();

        it('when postponed = false and isKnockout=true', async () => {
            const fixtureData: GameDto = fixtureBuilder()
                .knockout()
                .address('ADDRESS')
                .playing('HOME', 'AWAY')
                .build();

            await renderComponent({
                saving: false,
                access: '',
                fixtureData,
                setFixtureData,
                season,
            });

            const component = context.container;
            expect(component.textContent).toContain('at: ADDRESS');
        });

        it('when postponed=true and isKnockout=false', async () => {
            const fixtureData: GameDto = fixtureBuilder()
                .postponed()
                .address('ADDRESS')
                .playing('HOME', 'AWAY')
                .build();

            await renderComponent({
                saving: false,
                access: '',
                fixtureData,
                setFixtureData,
                season,
            });

            const component = context.container;
            expect(component.textContent).toContain(
                'Playing at: ADDRESSPostponed',
            );
        });

        it('when postponed=true and isKnockout=true', async () => {
            const fixtureData: GameDto = fixtureBuilder()
                .knockout()
                .postponed()
                .address('ADDRESS')
                .playing('HOME', 'AWAY')
                .build();

            await renderComponent({
                saving: false,
                access: '',
                fixtureData,
                setFixtureData,
                season,
            });

            const component = context.container;
            expect(component.textContent).toContain('at: ADDRESSPostponed');
        });

        it('when away is unset', async () => {
            const fixtureData: GameDto = fixtureBuilder()
                .knockout()
                .postponed()
                .address('ADDRESS')
                .bye('HOME')
                .build();

            await renderComponent({
                saving: false,
                access: '',
                fixtureData,
                setFixtureData,
                season,
            });

            const shareButton = context.container.querySelectorAll('button')[0];
            expect(shareButton).toBeFalsy();
        });

        it('when home and away are set', async () => {
            const fixtureData: GameDto = fixtureBuilder()
                .knockout()
                .postponed()
                .address('ADDRESS')
                .playing('HOME', 'AWAY')
                .build();

            await renderComponent({
                saving: false,
                access: '',
                fixtureData,
                setFixtureData,
                season,
            });

            reportedError.verifyNoError();
            const shareButton = context.container.querySelectorAll('button')[0];
            expect(shareButton).toBeTruthy();
            expect(shareButton.textContent).toEqual('🔗');
        });
    });

    describe('when an admin', () => {
        const season = seasonBuilder()
            .starting('2023-04-01')
            .ending('2024-04-08')
            .build();

        describe('renders', () => {
            it('date', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });

                const input = context.container.querySelector(
                    'input[name="date"]',
                ) as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.value).toEqual('2023-04-01');
            });

            it('address', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });

                const input = context.container.querySelector(
                    'input[name="address"]',
                ) as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.value).toEqual('ADDRESS');
            });

            it('postponed', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .postponed()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });

                const input = context.container.querySelector(
                    'input[name="postponed"]',
                ) as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });

            it('isKnockout', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .knockout()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });

                const input = context.container.querySelector(
                    'input[name="isKnockout"]',
                ) as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });

            it('accoladesCount', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .postponed()
                    .accoladesCount()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });

                const input = context.container.querySelector(
                    'input[name="accoladesCount"]',
                ) as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });
        });

        describe('changes', () => {
            it('date', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });
                await doChange(
                    context.container,
                    'input[name="date"]',
                    '2023-05-01',
                    context.user,
                );

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.date).toEqual('2023-05-01');
            });

            it('address', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });
                await doChange(
                    context.container,
                    'input[name="address"]',
                    'NEW ADDRESS',
                    context.user,
                );

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.address).toEqual('NEW ADDRESS');
            });

            it('postponed', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .postponed()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });
                await doClick(context.container, 'input[name="postponed"]');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.postponed).toEqual(false);
            });

            it('isKnockout', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .knockout()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });
                await doClick(context.container, 'input[name="isKnockout"]');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.isKnockout).toEqual(false);
            });

            it('accoladesCount', async () => {
                const fixtureData: GameDto = fixtureBuilder(
                    '2023-04-01T20:30:00',
                )
                    .accoladesCount()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                    season,
                });
                await doClick(
                    context.container,
                    'input[name="accoladesCount"]',
                );

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.accoladesCount).toEqual(false);
            });
        });
    });
});
