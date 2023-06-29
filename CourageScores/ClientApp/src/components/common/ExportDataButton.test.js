// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../../helpers/tests";
import React from "react";
import {ExportDataButton} from "./ExportDataButton";

describe('ExportDataButton', () => {
    let context;
    let reportedError;
    let exportRequest;
    let apiResult;

    const dataApi = {
        export: (request) => {
            exportRequest = request;
            return apiResult || { success: false };
        },
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, account) {
        reportedError = null;
        exportRequest = null;
        apiResult = null;
        context = await renderApp(
            { dataApi },
            null,
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
            },
            (<ExportDataButton {...props} />));
    }

    describe('when logged out', () => {
        const account = null;

        it('renders nothing', async () => {
            await renderComponent({}, account);

            expect(context.container.innerHTML).toEqual('');
        });
    });

    describe('when logged in, not permitted to export', () => {
        const account = {
            access: { exportData: false },
        };

        it('renders nothing', async () => {
            await renderComponent({}, account);

            expect(context.container.innerHTML).toEqual('');
        });
    });

    describe('when logged in, permitted to export', () => {
        const account = {
            access: { exportData: true },
        };

        it('when nothing to export, does not render button', async () => {
            await renderComponent({}, account);

            expect(context.container.innerHTML).toEqual('');
        });

        it('when something to export, renders button', async () => {
            await renderComponent({
                tables: {
                    tournamentGame: [ 'id1' ],
                    recordedScoreAsYouGo: [ 'id2', 'id3' ],
                }
            }, account);

            const button = context.container.querySelector('button');
            expect(button).toBeTruthy();
            expect(button.textContent).toEqual('🛒');
        });

        it('when clicked, tries to export data', async () => {
            await renderComponent({
                tables: {
                    tournamentGame: [ 'id1' ],
                    recordedScoreAsYouGo: [ 'id2', 'id3' ],
                }
            }, account);
            const button = context.container.querySelector('button');
            window.alert = () => {};

            await doClick(button);

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [ 'id1' ],
                    recordedScoreAsYouGo: [ 'id2', 'id3' ],
                },
            });
        });

        it('when clicked, handles error during export', async () => {
            await renderComponent({
                tables: {
                    tournamentGame: [ 'id1' ],
                    recordedScoreAsYouGo: [ 'id2', 'id3' ],
                }
            }, account);
            const button = context.container.querySelector('button');
            let alert;
            window.alert = (msg) => alert = msg;

            await doClick(button);

            expect(exportRequest).not.toBeNull();
            expect(alert).toEqual('Unable to export data');
        });

        it('when clicked, allows download of content', async () => {
            await renderComponent({
                tables: {
                    tournamentGame: [ 'id1' ],
                    recordedScoreAsYouGo: [ 'id2', 'id3' ],
                }
            }, account);
            const button = context.container.querySelector('button');
            apiResult = {
                success: true,
                result: {
                    zip: 'ZIP CONTENT'
                },
            };
            let openedWindow;
            window.open = (url) => { openedWindow = url; }

            await doClick(button);

            expect(exportRequest).not.toBeNull();
            expect(openedWindow).toEqual('data:application/zip;base64,ZIP CONTENT');
        });
    });
});