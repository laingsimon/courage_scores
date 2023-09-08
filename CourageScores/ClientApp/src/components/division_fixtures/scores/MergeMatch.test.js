// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../../helpers/tests";
import {MergeMatch} from "./MergeMatch";
import {fixtureBuilder, playerBuilder} from "../../../helpers/builders";

describe('MergeMatch', () => {
    let context;
    let reportedError;
    let updatedData;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
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
            (<MergeMatch {...props} setFixtureData={(data) => updatedData = data}/>),
            null,
            null,
            'tbody');
    }

    describe('renders', () => {
        it('when published', async () => {
            const match = {
                homeScore: 1,
                awayScore: 2,
                homePlayers: [],
                awayPlayers: [],
            };

            await renderComponent({
                readOnly: false,
                matches: [match],
                matchIndex: 0,
                homeSubmission: {},
                awaySubmission: {},
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home and away submissions match', async () => {
            const match = {};
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome().withAway().scores(1, 2)))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome().withAway().scores(1, 2)))
                .build();
            await renderComponent({
                readOnly: false,
                matches: [match],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            const td = context.container.querySelector('td');
            expect(td.colSpan).toEqual(5);
            expect(td.querySelector('button')).toBeTruthy();
            expect(td.querySelector('span > div').textContent).toEqual('HOME: 1 - AWAY: 2');
        });

        it('when home and away submissions match and readonly', async () => {
            const match = {};
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome().withAway().scores(1, 2)))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome().withAway().scores(1, 2)))
                .build();
            await renderComponent({
                readOnly: true,
                matches: [match],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            const td = context.container.querySelector('td');
            expect(td.colSpan).toEqual(5);
            expect(td.querySelector('button')).toBeTruthy();
            expect(td.querySelector('span > div').textContent).toEqual('HOME: 1 - AWAY: 2');
            expect(td.querySelector('button').disabled).toEqual(true);
        });

        it('when home but no away submission match', async () => {
            const match = {};
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome().withAway().scores(1, 2)))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY'))
                .build();
            await renderComponent({
                readOnly: true,
                matches: [match],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            const td = context.container.querySelector('td:nth-child(3)');
            expect(td.colSpan).toEqual(2);
            expect(td.querySelector('span').textContent).toEqual('No match');
        });

        it('when nothing to merge for either home or away', async () => {
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s.author('HOME CAPTAIN').playing('HOME', 'AWAY'))
                .awaySubmission(s => s.author('AWAY CAPTAIN').playing('HOME', 'AWAY'))
                .build();
            await renderComponent({
                readOnly: false,
                matches: [{}],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home unmerged', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch(m => m.withHome().withAway()))
                .build();
            await renderComponent({
                readOnly: false,
                matches: [{}],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            const homeSubmission = context.container.querySelector('td:nth-child(1)');
            expect(homeSubmission.colSpan).toEqual(2);
            expect(homeSubmission.textContent).toContain('from HOME CAPTAIN');
            expect(homeSubmission.textContent).toContain('HOME: 1 - AWAY: 2');
            expect(homeSubmission.textContent).toContain('HOME PLAYER vs AWAY PLAYER');
        });

        it('when home unmerged and readonly', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch(m => m.withHome().withAway()))
                .build();
            await renderComponent({
                readOnly: true,
                matches: [{}],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            const homeSubmission = context.container.querySelector('td:nth-child(1)');
            expect(homeSubmission.colSpan).toEqual(2);
            expect(homeSubmission.querySelector('button').disabled).toEqual(true);
        });

        it('when away unmerged', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch(m => m.withHome().withAway()))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .build();
            await renderComponent({
                readOnly: false,
                matches: [{}],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            const awaySubmission = context.container.querySelector('td:nth-child(3)');
            expect(awaySubmission.colSpan).toEqual(2);
            expect(awaySubmission.textContent).toContain('from AWAY CAPTAIN');
            expect(awaySubmission.textContent).toContain('HOME: 1 - AWAY: 2');
            expect(awaySubmission.textContent).toContain('HOME PLAYER vs AWAY PLAYER');
        });

        it('when away unmerged and readonly', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch(m => m.withHome().withAway()))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .build();
            await renderComponent({
                readOnly: true,
                matches: [{}],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {}
            });

            expect(reportedError).toBeNull();
            const awaySubmission = context.container.querySelector('td:nth-child(3)');
            expect(awaySubmission.colSpan).toEqual(2);
            expect(awaySubmission.querySelector('button').disabled).toEqual(true);
        });
    });

    describe('interactivity', () => {
        it('can merge home submission', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch(m => m.withHome().withAway()))
                .withMatch(m => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [{}],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {
                    matches: [{}]
                }
            });
            const homeSubmission = context.container.querySelector('td:nth-child(1)');

            await doClick(findButton(homeSubmission, 'Accept'));

            expect(reportedError).toBeNull();
            expect(updatedData.matches[0]).toEqual({
                awayPlayers: [awayPlayer],
                homePlayers: [homePlayer],
                awayScore: 2,
                homeScore: 1,
            });
        });

        it('can merge away submission', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch(m => m.withHome().withAway()))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .withMatch(m => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [{}],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {
                    matches: [{}]
                }
            });
            const awaySubmission = context.container.querySelector('td:nth-child(3)');

            await doClick(findButton(awaySubmission, 'Accept'));

            expect(reportedError).toBeNull();
            expect(updatedData.matches[0]).toEqual({
                awayPlayers: [awayPlayer],
                homePlayers: [homePlayer],
                awayScore: 2,
                homeScore: 1,
            });
        });

        it('can merge matching submissions', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .awaySubmission(s => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .withMatch(m => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [{}],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: {
                    matches: [{}]
                }
            });
            const homeSubmission = context.container.querySelector('td:nth-child(1)');

            await doClick(findButton(homeSubmission, 'Accept'));

            expect(reportedError).toBeNull();
            expect(updatedData.matches[0]).toEqual({
                awayPlayers: [awayPlayer],
                homePlayers: [homePlayer],
                awayScore: 2,
                homeScore: 1,
            });
        });
    })
});