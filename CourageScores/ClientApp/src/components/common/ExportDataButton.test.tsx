import {api, appProps, cleanUp, doClick, iocProps, noop, renderApp, TestContext} from "../../helpers/tests";
import React from "react";
import {ExportDataButton, IExportDataButtonProps} from "./ExportDataButton";
import {IUserDto} from "../../interfaces/dtos/Identity/IUserDto";
import {IExportDataRequestDto} from "../../interfaces/dtos/Data/IExportDataRequestDto";
import {IExportDataResultDto} from "../../interfaces/dtos/Data/IExportDataResultDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IDataApi} from "../../api/data";

describe('ExportDataButton', () => {
    let context: TestContext;
    let exportRequest: IExportDataRequestDto;
    let apiResult: IClientActionResultDto<IExportDataResultDto>;

    const dataApi = api<IDataApi>({
        export: async (request: IExportDataRequestDto): Promise<IClientActionResultDto<IExportDataResultDto>> => {
            exportRequest = request;
            return apiResult || {success: false};
        },
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props: IExportDataButtonProps, account: IUserDto) {
        exportRequest = null;
        apiResult = null;
        context = await renderApp(
            iocProps({dataApi}),
            null,
            appProps({account}),
            (<ExportDataButton {...props} />));
    }

    describe('when logged out', () => {
        const account: IUserDto = null;

        it('renders nothing', async () => {
            await renderComponent({}, account);

            expect(context.container.innerHTML).toEqual('');
        });
    });

    describe('when logged in, not permitted to export', () => {
        const account: IUserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                exportData: false
            },
        };

        it('renders nothing', async () => {
            await renderComponent({}, account);

            expect(context.container.innerHTML).toEqual('');
        });
    });

    describe('when logged in, permitted to export', () => {
        const account: IUserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                exportData: true
            },
        };

        it('when nothing to export, does not render button', async () => {
            await renderComponent({}, account);

            expect(context.container.innerHTML).toEqual('');
        });

        it('when something to export, renders button', async () => {
            await renderComponent({
                tables: {
                    tournamentGame: ['id1'],
                    recordedScoreAsYouGo: ['id2', 'id3'],
                }
            }, account);

            const button = context.container.querySelector('button');
            expect(button).toBeTruthy();
            expect(button.textContent).toEqual('🛒');
        });

        it('when clicked, tries to export data', async () => {
            await renderComponent({
                tables: {
                    tournamentGame: ['id1'],
                    recordedScoreAsYouGo: ['id2', 'id3'],
                }
            }, account);
            const button = context.container.querySelector('button');
            window.alert = noop;

            await doClick(button);

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: ['id1'],
                    recordedScoreAsYouGo: ['id2', 'id3'],
                },
            });
        });

        it('when clicked, handles error during export', async () => {
            await renderComponent({
                tables: {
                    tournamentGame: ['id1'],
                    recordedScoreAsYouGo: ['id2', 'id3'],
                }
            }, account);
            const button = context.container.querySelector('button');
            let alert: string;
            window.alert = (msg) => alert = msg;

            await doClick(button);

            expect(exportRequest).not.toBeNull();
            expect(alert).toEqual('Unable to export data');
        });

        it('when clicked, allows download of content', async () => {
            await renderComponent({
                tables: {
                    tournamentGame: ['id1'],
                    recordedScoreAsYouGo: ['id2', 'id3'],
                }
            }, account);
            const button = context.container.querySelector('button');
            apiResult = {
                success: true,
                result: {
                    zip: 'ZIP CONTENT'
                },
            };
            let openedWindow: string;
            (window as any).open = (url: string) => {
                openedWindow = url;
            }

            await doClick(button);

            expect(exportRequest).not.toBeNull();
            expect(openedWindow).toEqual('data:application/zip;base64,ZIP CONTENT');
        });
    });
});