// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../../helpers/tests";
import {createTemporaryId} from "../../../helpers/projection";
import {MergeManOfTheMatch} from "./MergeManOfTheMatch";
import {playerBuilder} from "../../../helpers/builders";

describe('MergeManOfTheMatch', () => {
    let context;
    let reportedError;
    let updatedData;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(data, allPlayers) {
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
            (<MergeManOfTheMatch
                data={data}
                allPlayers={allPlayers}
                setData={(data) => updatedData = data}/>),
            null,
            null,
            'tbody');
    }

    describe('renders', () => {
        const playerId = createTemporaryId();
        const allPlayers = [playerBuilder('MOM', playerId).build()];

        it('when home merged', async () => {
            const data = {
                home: {
                    manOfTheMatch: playerId,
                },
                away: {},
                homeSubmission: {
                    home: {},
                    away: {},
                },
                awaySubmission: {
                    home: {},
                    away: {},
                },
            };

            await renderComponent(data, allPlayers);

            const homeMOM = context.container.querySelector('td:nth-child(1)');
            expect(homeMOM.textContent).toEqual('Merged');
        });

        it('when away merged', async () => {
            const data = {
                home: {},
                away: {
                    manOfTheMatch: playerId,
                },
                homeSubmission: {
                    home: {},
                    away: {},
                },
                awaySubmission: {
                    home: {},
                    away: {},
                },
            };

            await renderComponent(data, allPlayers);

            const awayMOM = context.container.querySelector('td:nth-child(3)');
            expect(awayMOM.textContent).toEqual('Merged');
        });

        it('when nothing to merge for home', async () => {
            const data = {
                home: {},
                away: {},
                homeSubmission: {
                    home: {},
                    away: {},
                },
                awaySubmission: {
                    home: {},
                    away: {}
                },
            };

            await renderComponent(data, allPlayers);

            const homeMOM = context.container.querySelector('td:nth-child(1)');
            expect(homeMOM.textContent).toEqual('Nothing to merge');
        });

        it('when nothing to merge for away', async () => {
            const data = {
                home: {},
                away: {},
                homeSubmission: {
                    home: {},
                    away: {},
                },
                awaySubmission: {
                    home: {},
                    away: {}
                },
            };

            await renderComponent(data, allPlayers);

            const awayMOM = context.container.querySelector('td:nth-child(3)');
            expect(awayMOM.textContent).toEqual('Nothing to merge');
        });

        it('when home unmerged', async () => {
            const data = {
                home: {},
                away: {},
                homeSubmission: {
                    home: {
                        manOfTheMatch: playerId
                    },
                    away: {},
                },
                awaySubmission: {
                    home: {},
                    away: {}
                },
            };

            await renderComponent(data, allPlayers);

            const homeMOM = context.container.querySelector('td:nth-child(1)');
            expect(homeMOM.textContent).toEqual('Use MOM');
        });

        it('when away unmerged', async () => {
            const data = {
                home: {},
                away: {},
                homeSubmission: {
                    home: {},
                    away: {},
                },
                awaySubmission: {
                    home: {},
                    away: {
                        manOfTheMatch: playerId
                    }
                },
            };

            await renderComponent(data, allPlayers);

            const awayMOM = context.container.querySelector('td:nth-child(3)');
            expect(awayMOM.textContent).toEqual('Use MOM');
        });
    });

    describe('interactivity', () => {
        const playerId = createTemporaryId();
        const allPlayers = [playerBuilder('MOM', playerId).build()];

        it('can change home man of match', async () => {
            const data = {
                home: {},
                away: {},
                homeSubmission: {
                    home: {
                        manOfTheMatch: playerId
                    },
                    away: {},
                },
                awaySubmission: {
                    home: {},
                    away: {}
                },
            };
            await renderComponent(data, allPlayers);

            await doClick(findButton(context.container.querySelector('td:nth-child(1)'), 'Use MOM'));

            expect(reportedError).toBeNull();
            expect(updatedData).not.toBeNull();
            expect(updatedData.home.manOfTheMatch).toEqual(playerId);
        });

        it('can change away man of match', async () => {
            const data = {
                home: {},
                away: {},
                homeSubmission: {
                    home: {},
                    away: {},
                },
                awaySubmission: {
                    home: {},
                    away: {
                        manOfTheMatch: playerId
                    }
                },
            };
            await renderComponent(data, allPlayers);

            await doClick(findButton(context.container.querySelector('td:nth-child(3)'), 'Use MOM'));

            expect(reportedError).toBeNull();
            expect(updatedData).not.toBeNull();
            expect(updatedData.away.manOfTheMatch).toEqual(playerId);
        });
    })
});