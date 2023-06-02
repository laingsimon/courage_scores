// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, renderApp, doClick, findButton} from "../../../tests/helpers";
import {createTemporaryId} from "../../../Utilities";
import {MergeMatch} from "./MergeMatch";

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
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<MergeMatch {...props} setFixtureData={(data) => updatedData = data} />),
            null,
            null,
            'tbody');
    }

    describe('renders', () => {
        it('when published', async () => {
            const match = {
                homeScore: 1,
                awayScore: 2,
                homePlayers:[],
                awayPlayers:[],
            };

            await renderComponent({
                readOnly: false,
                matches: [ match ],
                matchIndex: 0,
                homeSubmission: {
                },
                awaySubmission: {
                },
                fixtureData: {
                }
            });

            expect(reportedError).toBeNull();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home and away submissions match', async () => {
            const match = {};
            await renderComponent({
                readOnly: false,
                matches: [ match ],
                matchIndex: 0,
                homeSubmission: {
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                awaySubmission: {
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                fixtureData: {
                }
            });

            expect(reportedError).toBeNull();
            const td = context.container.querySelector('td');
            expect(td.colSpan).toEqual(5);
            expect(td.querySelector('button')).toBeTruthy();
            expect(td.querySelector('span > div').textContent).toEqual('HOME: 1 - AWAY: 2');
        });

        it('when home and away submissions match and readonly', async () => {
            const match = {};
            await renderComponent({
                readOnly: true,
                matches: [ match ],
                matchIndex: 0,
                homeSubmission: {
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                awaySubmission: {
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                fixtureData: {
                }
            });

            expect(reportedError).toBeNull();
            const td = context.container.querySelector('td');
            expect(td.colSpan).toEqual(5);
            expect(td.querySelector('button')).toBeTruthy();
            expect(td.querySelector('span > div').textContent).toEqual('HOME: 1 - AWAY: 2');
            expect(td.querySelector('button').disabled).toEqual(true);
        });

        it('when nothing to merge for either home or away', async () => {
            await renderComponent({
                readOnly: false,
                matches: [ {} ],
                matchIndex: 0,
                homeSubmission: {
                    author: 'HOME CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ ]
                },
                awaySubmission: {
                    author: 'AWAY CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ ]
                },
                fixtureData: {
                }
            });

            expect(reportedError).toBeNull();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home unmerged', async () => {
            const homePlayer = { id: createTemporaryId(),  name: 'HOME PLAYER' };
            const awayPlayer = { id: createTemporaryId(), name: 'AWAY PLAYER' };
            await renderComponent({
                readOnly: false,
                matches: [ {} ],
                matchIndex: 0,
                homeSubmission: {
                    author: 'HOME CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ],
                    } ]
                },
                awaySubmission: {
                    author: 'AWAY CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                fixtureData: {
                }
            });

            expect(reportedError).toBeNull();
            const homeSubmission = context.container.querySelector('td:nth-child(1)');
            expect(homeSubmission.colSpan).toEqual(2);
            expect(homeSubmission.textContent).toContain('from HOME CAPTAIN');
            expect(homeSubmission.textContent).toContain('HOME: 1 - AWAY: 2');
            expect(homeSubmission.textContent).toContain('HOME PLAYER vs AWAY PLAYER');
        });

        it('when home unmerged and readonly', async () =>{
            const homePlayer = { id: createTemporaryId(),  name: 'HOME PLAYER' };
            const awayPlayer = { id: createTemporaryId(), name: 'AWAY PLAYER' };
            await renderComponent({
                readOnly: true,
                matches: [ {} ],
                matchIndex: 0,
                homeSubmission: {
                    author: 'HOME CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ],
                    } ]
                },
                awaySubmission: {
                    author: 'AWAY CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                fixtureData: {
                }
            });

            expect(reportedError).toBeNull();
            const homeSubmission = context.container.querySelector('td:nth-child(1)');
            expect(homeSubmission.colSpan).toEqual(2);
            expect(homeSubmission.querySelector('button').disabled).toEqual(true);
        });

        it('when away unmerged', async () => {
            const homePlayer = { id: createTemporaryId(),  name: 'HOME PLAYER' };
            const awayPlayer = { id: createTemporaryId(), name: 'AWAY PLAYER' };
            await renderComponent({
                readOnly: false,
                matches: [ {} ],
                matchIndex: 0,
                homeSubmission: {
                    author: 'HOME CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                awaySubmission: {
                    author: 'AWAY CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ],
                    } ]
                },
                fixtureData: {
                }
            });

            expect(reportedError).toBeNull();
            const awaySubmission = context.container.querySelector('td:nth-child(3)');
            expect(awaySubmission.colSpan).toEqual(2);
            expect(awaySubmission.textContent).toContain('from AWAY CAPTAIN');
            expect(awaySubmission.textContent).toContain('HOME: 1 - AWAY: 2');
            expect(awaySubmission.textContent).toContain('HOME PLAYER vs AWAY PLAYER');
        });

        it('when away unmerged and readonly', async () =>{
            const homePlayer = { id: createTemporaryId(),  name: 'HOME PLAYER' };
            const awayPlayer = { id: createTemporaryId(), name: 'AWAY PLAYER' };
            await renderComponent({
                readOnly: true,
                matches: [ {} ],
                matchIndex: 0,
                homeSubmission: {
                    author: 'HOME CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                awaySubmission: {
                    author: 'AWAY CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ],
                    } ]
                },
                fixtureData: {
                }
            });

            expect(reportedError).toBeNull();
            const awaySubmission = context.container.querySelector('td:nth-child(3)');
            expect(awaySubmission.colSpan).toEqual(2);
            expect(awaySubmission.querySelector('button').disabled).toEqual(true);
        });
    });

    describe('interactivity', () => {
        it('can merge home submission', async () => {
            const homePlayer = { id: createTemporaryId(),  name: 'HOME PLAYER' };
            const awayPlayer = { id: createTemporaryId(), name: 'AWAY PLAYER' };
            await renderComponent({
                readOnly: false,
                matches: [ {} ],
                matchIndex: 0,
                homeSubmission: {
                    author: 'HOME CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ],
                    } ]
                },
                awaySubmission: {
                    author: 'AWAY CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                fixtureData: {
                    matches: [ {} ],
                }
            });
            const homeSubmission = context.container.querySelector('td:nth-child(1)');

            await doClick(findButton(homeSubmission, 'Accept'));

            expect(reportedError).toBeNull();
            expect(updatedData.matches[0]).toEqual({
                awayPlayers: [ awayPlayer ],
                homePlayers: [ homePlayer ],
                awayScore: 2,
                homeScore: 1,
            });
        });

        it('can merge away submission', async () => {
            const homePlayer = { id: createTemporaryId(),  name: 'HOME PLAYER' };
            const awayPlayer = { id: createTemporaryId(), name: 'AWAY PLAYER' };
            await renderComponent({
                readOnly: false,
                matches: [ {} ],
                matchIndex: 0,
                homeSubmission: {
                    author: 'HOME CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homePlayers: [],
                        awayPlayers: [],
                    } ]
                },
                awaySubmission: {
                    author: 'AWAY CAPTAIN',
                    home: { name: 'HOME' },
                    away: { name: 'AWAY' },
                    matches: [ {
                        homeScore: 1,
                        awayScore: 2,
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ],
                    } ]
                },
                fixtureData: {
                    matches: [ {} ]
                }
            });
            const awaySubmission = context.container.querySelector('td:nth-child(3)');

            await doClick(findButton(awaySubmission, 'Accept'));

            expect(reportedError).toBeNull();
            expect(updatedData.matches[0]).toEqual({
                awayPlayers: [ awayPlayer ],
                homePlayers: [ homePlayer ],
                awayScore: 2,
                homeScore: 1,
            });
        });
    })
});