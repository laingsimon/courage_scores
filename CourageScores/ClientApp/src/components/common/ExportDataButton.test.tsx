import {api, appProps, cleanUp, doClick, iocProps, noop, renderApp, TestContext} from "../../helpers/tests";
import {ExportDataButton, IExportDataButtonProps} from "./ExportDataButton";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {ExportDataRequestDto} from "../../interfaces/models/dtos/Data/ExportDataRequestDto";
import {ExportDataResultDto} from "../../interfaces/models/dtos/Data/ExportDataResultDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IDataApi} from "../../interfaces/apis/IDataApi";

describe('ExportDataButton', () => {
    let context: TestContext;
    let exportRequest: ExportDataRequestDto;
    let apiResult: IClientActionResultDto<ExportDataResultDto>;

    const dataApi = api<IDataApi>({
        export: async (request: ExportDataRequestDto): Promise<IClientActionResultDto<ExportDataResultDto>> => {
            exportRequest = request;
            return apiResult || {success: false};
        },
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props: IExportDataButtonProps, account: UserDto) {
        exportRequest = null;
        apiResult = null;
        context = await renderApp(
            iocProps({dataApi}),
            null,
            appProps({account}),
            (<ExportDataButton {...props} />));
    }

    describe('when logged out', () => {
        const account: UserDto = null;

        it('renders nothing', async () => {
            await renderComponent({}, account);

            expect(context.container.innerHTML).toEqual('');
        });
    });

    describe('when logged in, not permitted to export', () => {
        const account: UserDto = {
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
        const account: UserDto = {
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