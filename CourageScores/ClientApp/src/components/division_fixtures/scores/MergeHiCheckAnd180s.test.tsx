import React from "react";
import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import {IMergeHiCheckAnd180sProps, MergeHiCheckAnd180s} from "./MergeHiCheckAnd180s";
import {IGameDto} from "../../../interfaces/models/dtos/Game/IGameDto";
import {fixtureBuilder, IFixtureBuilder} from "../../../helpers/builders/games";
import {playerBuilder} from "../../../helpers/builders/players";

describe('MergeHiCheckAnd180s', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: IGameDto;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedData = null;
    });

    async function setFixtureData(newData: IGameDto) {
        updatedData = newData;
    }

    async function renderComponent(props: IMergeHiCheckAnd180sProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MergeHiCheckAnd180s {...props} />),
            null,
            null,
            'tbody');
    }

    describe('one eighties', () => {
        describe('renders', () => {
            it('when home submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME').with180('NAME'))
                    .awaySubmission((s: IFixtureBuilder) => s)
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                expect(homeSubmission).not.toBeNull();
                const oneEighties = Array.from(homeSubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(oneEighties).toEqual(['NAME']);
            });

            it('when away submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s)
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY').with180('NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(awaySubmission).not.toBeNull();
                const oneEighties = Array.from(awaySubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(oneEighties).toEqual(['NAME']);
            });

            it('when home and away submissions not present', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME'))
                    .awaySubmission((s: IFixtureBuilder) => s)
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when submissions merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME').with180('HOME NAME'))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY').with180('AWAY NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .with180('MERGED')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no home submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY').with180('NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).not.toBeNull();
            });

            it('when no away submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME').with180('NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(homeSubmission).not.toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no submissions', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });
        });

        describe('interactivity', () => {
            it('can merge home submission', async () => {
                const player = playerBuilder('NAME').build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME').with180(player))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();
                await renderComponent({ data, fixtureData, setFixtureData });
                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');

                await doClick(findButton(homeSubmission, 'Merge'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedData).not.toBeNull();
                expect(updatedData.oneEighties).toEqual([player]);
            });

            it('can merge away submission', async () => {
                const player = playerBuilder('NAME').build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME'))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY').with180(player))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();
                await renderComponent({ data, fixtureData, setFixtureData });
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');

                await doClick(findButton(awaySubmission, 'Merge'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedData).not.toBeNull();
                expect(updatedData.oneEighties).toEqual([player]);
            });
        });
    });

    describe('hi-checks', () => {
        describe('renders', () => {
            it('when home submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME').withHiCheck('NAME', '120'))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                expect(homeSubmission).not.toBeNull();
                const hiChecks = Array.from(homeSubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(hiChecks).toEqual(['NAME (120)']);
            });

            it('when away submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME'))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY').withHiCheck('NAME', '120'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(awaySubmission).not.toBeNull();
                const hiChecks = Array.from(awaySubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(hiChecks).toEqual(['NAME (120)']);
            });

            it('when home and away submissions not present', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME'))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when submissions merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME').withHiCheck('HOME NAME', '120'))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY').withHiCheck('AWAY NAME', '120'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .withHiCheck('MERGED', '120')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                expect(reportedError.hasError()).toEqual(false);
                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no home submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY').withHiCheck('NAME', '100'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).not.toBeNull();
            });

            it('when no away submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME').withHiCheck('NAME', '100'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(homeSubmission).not.toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no submissions', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });
        });

        describe('interactivity', () => {
            it('can merge home submission', async () => {
                const player = playerBuilder('NAME').notes('120').build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME').withHiCheck(player, '120'))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();
                await renderComponent({ data, fixtureData, setFixtureData });
                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');

                await doClick(findButton(homeSubmission, 'Merge'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedData).not.toBeNull();
                expect(updatedData.over100Checkouts).toEqual([player]);
            });

            it('can merge away submission', async () => {
                const player = playerBuilder('NAME').notes('120').build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s: IFixtureBuilder) => s.editor('HOME'))
                    .awaySubmission((s: IFixtureBuilder) => s.editor('AWAY').withHiCheck(player, '120'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();
                await renderComponent({ data, fixtureData, setFixtureData });
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');

                await doClick(findButton(awaySubmission, 'Merge'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedData).not.toBeNull();
                expect(updatedData.over100Checkouts).toEqual([player]);
            });
        });
    })
});