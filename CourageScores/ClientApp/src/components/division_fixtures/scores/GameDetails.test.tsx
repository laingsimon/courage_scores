import React from "react";
import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    ErrorState,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import {GameDetails, IGameDetailsProps} from "./GameDetails";
import {fixtureBuilder} from "../../../helpers/builders/games";
import {IGameDto} from "../../../interfaces/models/dtos/Game/IGameDto";

describe('GameDetails', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedFixtureData: IGameDto;

    async function setFixtureData(newFixtureData: IGameDto) {
        updatedFixtureData = newFixtureData;
    }

    afterEach(() => {
        cleanUp(context);
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
            (<GameDetails {...props} />));
    }

    describe('when not logged in', () => {
        it('when postponed = false and isKnockout=true', async () => {
            const fixtureData: IGameDto = fixtureBuilder()
                .knockout()
                .address('ADDRESS')
                .playing('HOME', 'AWAY')
                .build();

            await renderComponent({
                saving: false,
                access: '',
                fixtureData,
                setFixtureData,
            });

            const component = context.container;
            expect(component.textContent).toContain('at: ADDRESS');
        });

        it('when postponed=true and isKnockout=false', async () => {
            const fixtureData: IGameDto = fixtureBuilder()
                .postponed()
                .address('ADDRESS')
                .playing('HOME', 'AWAY')
                .build();

            await renderComponent({
                saving: false,
                access: '',
                fixtureData,
                setFixtureData,
            });

            const component = context.container;
            expect(component.textContent).toContain('Playing at: ADDRESSPostponed');
        });

        it('when postponed=true and isKnockout=true', async () => {
            const fixtureData: IGameDto = fixtureBuilder()
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
            });

            const component = context.container;
            expect(component.textContent).toContain('at: ADDRESSPostponed');
        });

        it('when away is unset', async () => {
            const fixtureData: IGameDto = fixtureBuilder()
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
            });

            const shareButton = context.container.querySelectorAll('button')[0];
            expect(shareButton).toBeFalsy();
        });

        it('when home and away are set', async () => {
            const fixtureData: IGameDto = fixtureBuilder()
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
            });

            expect(reportedError.hasError()).toEqual(false);
            const shareButton = context.container.querySelectorAll('button')[0];
            expect(shareButton).toBeTruthy();
            expect(shareButton.textContent).toEqual('🔗');
        });
    });

    describe('when an admin', () => {
        describe('renders', () => {
            it('date', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const input = context.container.querySelector('input[name="date"]') as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.value).toEqual('2023-04-01');
            });

            it('address', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const input = context.container.querySelector('input[name="address"]') as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.value).toEqual('ADDRESS');
            });

            it('postponed', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .postponed()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const input = context.container.querySelector('input[name="postponed"]') as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });

            it('isKnockout', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .knockout()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });

                const input = context.container.querySelector('input[name="isKnockout"]') as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });

            it('accoladesCount', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
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
                });

                const input = context.container.querySelector('input[name="accoladesCount"]') as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.checked).toEqual(true);
            });
        });

        describe('changes', () => {
            it('date', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                await doChange(context.container, 'input[name="date"]', '2023-05-01', context.user);

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.date).toEqual('2023-05-01');
            });

            it('address', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                await doChange(context.container, 'input[name="address"]', 'NEW ADDRESS', context.user);

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.address).toEqual('NEW ADDRESS');
            });

            it('postponed', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .postponed()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                await doClick(context.container, 'input[name="postponed"]');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.postponed).toEqual(false);
            });

            it('isKnockout', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .knockout()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                await doClick(context.container, 'input[name="isKnockout"]');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.isKnockout).toEqual(false);
            });

            it('accoladesCount', async () => {
                const fixtureData: IGameDto = fixtureBuilder('2023-04-01T20:30:00')
                    .accoladesCount()
                    .address('ADDRESS')
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent({
                    saving: false,
                    access: 'admin',
                    fixtureData,
                    setFixtureData,
                });
                await doClick(context.container, 'input[name="accoladesCount"]');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.accoladesCount).toEqual(false);
            });
        });
    });
});