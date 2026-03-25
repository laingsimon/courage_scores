import {
    appProps,
    brandingProps,
    cleanUp,
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

            expect(context.text()).toContain('at: ADDRESS');
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

            expect(context.text()).toContain('Playing at: ADDRESSPostponed');
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

            expect(context.text()).toContain('at: ADDRESSPostponed');
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

            expect(context.optional('button')).toBeFalsy();
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
            expect(context.button('🔗').text()).toEqual('🔗');
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

                expect(context.input('date').value()).toEqual('2023-04-01');
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

                expect(context.input('address').value()).toEqual('ADDRESS');
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

                expect(
                    context.input('postponed').element<HTMLInputElement>()
                        .checked,
                ).toEqual(true);
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

                expect(
                    context.input('isKnockout').element<HTMLInputElement>()
                        .checked,
                ).toEqual(true);
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

                expect(
                    context.input('accoladesCount').element<HTMLInputElement>()
                        .checked,
                ).toEqual(true);
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
                await context.input('date').change('2023-05-01');

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
                await context.input('address').change('NEW ADDRESS');

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
                await context.input('postponed').click();

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
                await context.input('isKnockout').click();

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
                await context.input('accoladesCount').click();

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData!.accoladesCount).toEqual(false);
            });
        });
    });
});
