// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../../helpers/tests";
import {MergeHiCheckAnd180s} from "./MergeHiCheckAnd180s";
import {fixtureBuilder, playerBuilder} from "../../../helpers/builders";

describe('MergeHiCheckAnd180s', () => {
    let context;
    let reportedError;
    let updatedData;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(data, fixtureData) {
        reportedError = null;
        updatedData = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<MergeHiCheckAnd180s
                data={data}
                fixtureData={fixtureData}
                setFixtureData={(data) => updatedData = data}/>),
            null,
            null,
            'tbody');
    }

    describe('one eighties', () => {
        describe('renders', () => {
            it('when home submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME').with180('NAME'))
                    .awaySubmission(s => s)
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                expect(homeSubmission).not.toBeNull();
                const oneEighties = Array.from(homeSubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(oneEighties).toEqual(['NAME']);
            });

            it('when away submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s)
                    .awaySubmission(s => s.editor('AWAY').with180('NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(awaySubmission).not.toBeNull();
                const oneEighties = Array.from(awaySubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(oneEighties).toEqual(['NAME']);
            });

            it('when home and away submissions not present', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME'))
                    .awaySubmission(s => s)
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when submissions merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME').with180('HOME NAME'))
                    .awaySubmission(s => s.editor('AWAY').with180('AWAY NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .with180('MERGED')
                    .build();

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no home submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .awaySubmission(s => s.editor('AWAY').with180('NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).not.toBeNull();
            });

            it('when no away submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME').with180('NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

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

                await renderComponent(data, fixtureData);

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
                    .homeSubmission(s => s.editor('HOME').with180(player))
                    .awaySubmission(s => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();
                await renderComponent(data, fixtureData);
                const homeSubmission = context.container.querySelector('div[datatype="home-180s"]');

                await doClick(findButton(homeSubmission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.oneEighties).toEqual([player]);
            });

            it('can merge away submission', async () => {
                const player = playerBuilder('NAME').build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME'))
                    .awaySubmission(s => s.editor('AWAY').with180(player))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();
                await renderComponent(data, fixtureData);
                const awaySubmission = context.container.querySelector('div[datatype="away-180s"]');

                await doClick(findButton(awaySubmission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.oneEighties).toEqual([player]);
            });
        });
    });

    describe('hi-checks', () => {
        describe('renders', () => {
            it('when home submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME').withHiCheck('NAME', '120'))
                    .awaySubmission(s => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                expect(homeSubmission).not.toBeNull();
                const hiChecks = Array.from(homeSubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(hiChecks).toEqual(['NAME (120)']);
            });

            it('when away submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME'))
                    .awaySubmission(s => s.editor('AWAY').withHiCheck('NAME', '120'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(awaySubmission).not.toBeNull();
                const hiChecks = Array.from(awaySubmission.querySelectorAll('ol > li')).map(li => li.textContent);
                expect(hiChecks).toEqual(['NAME (120)']);
            });

            it('when home and away submissions not present', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME'))
                    .awaySubmission(s => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when submissions merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME').withHiCheck('HOME NAME', '120'))
                    .awaySubmission(s => s.editor('AWAY').withHiCheck('AWAY NAME', '120'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .withHiCheck('MERGED', '120')
                    .build();

                await renderComponent(data, fixtureData);

                expect(reportedError).toBeNull();
                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no home submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .awaySubmission(s => s.editor('AWAY').withHiCheck('NAME', '100'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).not.toBeNull();
            });

            it('when no away submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME').withHiCheck('NAME', '100'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

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

                await renderComponent(data, fixtureData);

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
                    .homeSubmission(s => s.editor('HOME').withHiCheck(player, '120'))
                    .awaySubmission(s => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();
                await renderComponent(data, fixtureData);
                const homeSubmission = context.container.querySelector('div[datatype="home-hichecks"]');

                await doClick(findButton(homeSubmission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.over100Checkouts).toEqual([player]);
            });

            it('can merge away submission', async () => {
                const player = playerBuilder('NAME').notes('120').build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME'))
                    .awaySubmission(s => s.editor('AWAY').withHiCheck(player, '120'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();
                await renderComponent(data, fixtureData);
                const awaySubmission = context.container.querySelector('div[datatype="away-hichecks"]');

                await doClick(findButton(awaySubmission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.over100Checkouts).toEqual([player]);
            });
        });
    })
});