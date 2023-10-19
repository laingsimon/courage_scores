// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../helpers/tests";
import React from "react";
import {DataError} from "./DataError";
import {DivisionDataContainer} from "./DivisionDataContainer";
import {createTemporaryId} from "../helpers/projection";

describe('DataError', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(containerProps, dataError) {
        reportedError = null;
        context = await renderApp(
            {},
            {},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<DivisionDataContainer {...containerProps}>
                <DataError dataError={dataError}/>
            </DivisionDataContainer>));
    }

    describe('renders', () => {
        it('message and no ids', async () => {
            await renderComponent({ }, { message: 'SOME MESSAGE' });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(0);
        });

        it('with gameId', async () => {
            const gameId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                },
                {
                    message: 'SOME MESSAGE',
                    gameId,
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(1);
            const link = context.container.querySelector('a');
            expect(link.textContent).toEqual('View fixture');
            expect(link.href).toEqual(`http://localhost/score/${gameId}`);
        });

        it('with tournamentId', async () => {
            const tournamentId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                },
                {
                    message: 'SOME MESSAGE',
                    tournamentId,
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(1);
            const link = context.container.querySelector('a');
            expect(link.textContent).toEqual('View tournament');
            expect(link.href).toEqual(`http://localhost/tournament/${tournamentId}`);
        });

        it('with teamId', async () => {
            const teamId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                },
                {
                    message: 'SOME MESSAGE',
                    teamId,
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(1);
            const link = context.container.querySelector('a');
            expect(link.textContent).toEqual('View team');
            expect(link.href).toEqual(`http://localhost/division/${divisionId}/team:${teamId}`);
        });

        it('with playerId only', async () => {
            const playerId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                },
                {
                    message: 'SOME MESSAGE',
                    playerId,
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(0);
        });

        it('with teamId and playerId', async () => {
            const teamId = createTemporaryId();
            const playerId = createTemporaryId();
            const divisionId = createTemporaryId();
            await renderComponent(
                {
                    id: divisionId,
                },
                {
                    message: 'SOME MESSAGE',
                    teamId,
                    playerId,
                });

            expect(context.container.textContent).toContain('SOME MESSAGE');
            expect(context.container.querySelectorAll('a').length).toEqual(1);
            const link = context.container.querySelector('a');
            expect(link.textContent).toEqual('View player');
            expect(link.href).toEqual(`http://localhost/division/${divisionId}/player:${playerId}@${teamId}`);
        });
    });
});