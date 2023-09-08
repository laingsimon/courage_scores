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
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell).toBeTruthy();
                const homeSubmission = oneEightiesCell.querySelector('div > div:nth-child(1)');
                expect(homeSubmission).toBeTruthy();
                expect(homeSubmission.textContent).toContain('from HOME');
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
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell).toBeTruthy();
                const awaySubmission = oneEightiesCell.querySelector('div > div:nth-child(1)');
                expect(awaySubmission).toBeTruthy();
                expect(awaySubmission.textContent).toContain('from AWAY');
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
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell).toBeTruthy();
                const submissions = oneEightiesCell.querySelectorAll('div');
                expect(submissions.length).toEqual(0);
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
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell).toBeTruthy();
                const submissions = oneEightiesCell.querySelectorAll('div');
                expect(submissions.length).toEqual(0);
            });

            it('when no home submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .awaySubmission(s => s.editor('AWAY').with180('NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell.querySelectorAll('div > div').length).toEqual(1);
            });

            it('when no away submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME').with180('NAME'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell.querySelectorAll('div > div').length).toEqual(1);
            });

            it('when no submissions', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                expect(oneEightiesCell.querySelectorAll('div > div').length).toEqual(0);
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
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                const submission = oneEightiesCell.querySelector('div > div:nth-child(1)');

                await doClick(findButton(submission, 'Merge'));

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
                const oneEightiesCell = context.container.querySelector('td:nth-child(1)');
                const submission = oneEightiesCell.querySelector('div > div:nth-child(1)');

                await doClick(findButton(submission, 'Merge'));

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
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                expect(hiChecksCell).toBeTruthy();
                const homeSubmission = hiChecksCell.querySelector('div > div:nth-child(1)');
                expect(homeSubmission).toBeTruthy();
                expect(homeSubmission.textContent).toContain('from HOME');
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
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                expect(hiChecksCell).toBeTruthy();
                const homeSubmission = hiChecksCell.querySelector('div > div:nth-child(1)');
                expect(homeSubmission).toBeTruthy();
                expect(homeSubmission.textContent).toContain('from AWAY');
                const hiChecks = Array.from(homeSubmission.querySelectorAll('ol > li')).map(li => li.textContent);
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
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                expect(hiChecksCell).toBeTruthy();
                const submissions = hiChecksCell.querySelectorAll('div > div');
                expect(submissions.length).toEqual(0);
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
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                expect(hiChecksCell).toBeTruthy();
                const submissions = hiChecksCell.querySelectorAll('div > div');
                expect(submissions.length).toEqual(0);
            });

            it('when no home submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .awaySubmission(s => s.editor('AWAY').withHiCheck('NAME', '100'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(3)');
                expect(oneEightiesCell.querySelectorAll('div > ol').length).toEqual(1);
            });

            it('when no away submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission(s => s.editor('HOME').withHiCheck('NAME', '100'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(3)');
                expect(oneEightiesCell.querySelectorAll('div > ol').length).toEqual(1);
            });

            it('when no submissions', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .build();

                await renderComponent(data, fixtureData);

                const oneEightiesCell = context.container.querySelector('td:nth-child(3)');
                expect(oneEightiesCell.querySelectorAll('div > ol').length).toEqual(0);
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
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                const submission = hiChecksCell.querySelector('div > div:nth-child(1)');

                await doClick(findButton(submission, 'Merge'));

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
                const hiChecksCell = context.container.querySelector('td:nth-child(3)');
                const submission = hiChecksCell.querySelector('div > div:nth-child(1)');

                await doClick(findButton(submission, 'Merge'));

                expect(reportedError).toBeNull();
                expect(updatedData).not.toBeNull();
                expect(updatedData.over100Checkouts).toEqual([player]);
            });
        });
    })
});