import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    IBrowserWindow,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { ExportDataButton, IExportDataButtonProps } from './ExportDataButton';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { ExportDataRequestDto } from '../../interfaces/models/dtos/Data/ExportDataRequestDto';
import { ExportDataResultDto } from '../../interfaces/models/dtos/Data/ExportDataResultDto';
import { IClientActionResultDto } from './IClientActionResultDto';
import { IDataApi } from '../../interfaces/apis/IDataApi';

describe('ExportDataButton', () => {
    let context: TestContext;
    let exportRequest: ExportDataRequestDto | null;
    let apiResult: IClientActionResultDto<ExportDataResultDto> | null;

    const dataApi = api<IDataApi>({
        export: async (
            request: ExportDataRequestDto,
        ): Promise<IClientActionResultDto<ExportDataResultDto>> => {
            exportRequest = request;
            return apiResult || { success: false };
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(
        props: IExportDataButtonProps,
        account?: UserDto,
    ) {
        exportRequest = null;
        apiResult = null;
        context = await renderApp(
            iocProps({ dataApi }),
            brandingProps(),
            appProps({ account }),
            <ExportDataButton {...props} />,
        );
    }

    describe('when logged out', () => {
        const account: UserDto | undefined = undefined;

        it('renders nothing', async () => {
            await renderComponent({}, account);

            expect(context.html()).toEqual('');
        });
    });

    describe('when logged in, not permitted to export', () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                exportData: false,
            },
        };

        it('renders nothing', async () => {
            await renderComponent({}, account);

            expect(context.html()).toEqual('');
        });
    });

    describe('when logged in, permitted to export', () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                exportData: true,
            },
        };

        it('when nothing to export, does not render button', async () => {
            await renderComponent({}, account);

            expect(context.html()).toEqual('');
        });

        it('when something to export, renders button', async () => {
            await renderComponent(
                {
                    tables: {
                        tournamentGame: ['id1'],
                        recordedScoreAsYouGo: ['id2', 'id3'],
                    },
                },
                account,
            );

            const button = context.required('button');
            expect(button.text()).toEqual('🛒');
        });

        it('when clicked, tries to export data', async () => {
            await renderComponent(
                {
                    tables: {
                        tournamentGame: ['id1'],
                        recordedScoreAsYouGo: ['id2', 'id3'],
                    },
                },
                account,
            );
            await context.button('🛒').click();

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
            await renderComponent(
                {
                    tables: {
                        tournamentGame: ['id1'],
                        recordedScoreAsYouGo: ['id2', 'id3'],
                    },
                },
                account,
            );
            await context.button('🛒').click();

            expect(exportRequest).not.toBeNull();
            context.prompts.alertWasShown('Unable to export data');
        });

        it('when clicked, allows download of content', async () => {
            await renderComponent(
                {
                    tables: {
                        tournamentGame: ['id1'],
                        recordedScoreAsYouGo: ['id2', 'id3'],
                    },
                },
                account,
            );
            apiResult = {
                success: true,
                result: {
                    zip: 'ZIP CONTENT',
                },
            };
            let openedWindow: string | undefined;
            (window as IBrowserWindow).open = (url: string) => {
                openedWindow = url;
            };

            await context.button('🛒').click();

            expect(exportRequest).not.toBeNull();
            expect(openedWindow).toEqual(
                'data:application/zip;base64,ZIP CONTENT',
            );
        });
    });
});
