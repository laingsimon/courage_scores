// noinspection JSUnresolvedFunction

import {TournamentContainer} from "./TournamentContainer";
import {renderApp} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";

describe('TournamentContainer', () => {
    let context;
    let reportedError;
    let sockets;

    const liveApi = {
        createSocket: async (id) => {
            const socket = {
                createdFor: id,
                send: () => {},
            };
            sockets.push(socket);
            return socket;
        },
    };

    async function renderComponent(appProps, containerProps) {
        reportedError = null;
        sockets = [];
        context = await renderApp(
            { liveApi },
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
                ...appProps,
            },
            (<TournamentContainer {...containerProps} setWebSocket={() => {}} />));
    }

    describe('live enabled', () => {
        it('should open sockets when not logged in', async () => {
            const account = null;
            const tournamentData = {
                id: createTemporaryId(),
            };

            await renderComponent(
                { account },
                { livePermitted: true,
                    enableLive: true,
                    tournamentData });

            expect(sockets.map(s => s.createdFor)).toEqual([tournamentData.id]);
        });

        it('should open sockets when not permitted', async () => {
            const account = {
                access: {}
            };
            const tournamentData = {
                id: createTemporaryId(),
            };

            await renderComponent(
                { account },
                { livePermitted: true,
                    enableLive: true,
                    tournamentData });

            expect(sockets.map(s => s.createdFor)).toEqual([tournamentData.id]);
        });

        it('should not open sockets when permitted', async () => {
            const account = {
                access: {
                    manageTournaments: true
                }
            };
            const tournamentData = {
                id: createTemporaryId(),
            };

            await renderComponent(
                { account },
                { livePermitted: true,
                    enableLive: true,
                    tournamentData });

            expect(sockets.map(s => s.createdFor)).toEqual([]);
        });
    });

    describe('live disabled', () => {
        it('should open sockets when not logged in', async () => {
            const account = null;
            const tournamentData = {
                id: createTemporaryId(),
            };

            await renderComponent(
                { account },
                { livePermitted: true,
                    enableLive: false,
                    tournamentData });

            expect(sockets.map(s => s.createdFor)).toEqual([]);
        });

        it('should open sockets when not permitted', async () => {
            const account = {
                access: {}
            };
            const tournamentData = {
                id: createTemporaryId(),
            };

            await renderComponent(
                { account },
                { livePermitted: true,
                    enableLive: false,
                    tournamentData });

            expect(sockets.map(s => s.createdFor)).toEqual([]);
        });

        it('should not open sockets when permitted', async () => {
            const account = {
                access: {
                    manageTournaments: true
                }
            };
            const tournamentData = {
                id: createTemporaryId(),
            };

            await renderComponent(
                { account },
                { livePermitted: true,
                    enableLive: true,
                    tournamentData });

            expect(sockets.map(s => s.createdFor)).toEqual([]);
        });
    });
});