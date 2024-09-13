import {AdminHome} from "./AdminHome";
import {AdminContainer} from "./AdminContainer";
import {api, appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {TableDto} from "../../interfaces/models/dtos/Data/TableDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {TemplateDto} from "../../interfaces/models/dtos/Season/Creation/TemplateDto";
import {WebSocketDto} from "../../interfaces/models/dtos/Live/WebSocketDto";
import {AccessDto} from "../../interfaces/models/dtos/Identity/AccessDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {AccountApi} from "../../interfaces/apis/IAccountApi";
import {SeasonTemplateApi} from "../../interfaces/apis/ISeasonTemplateApi";
import {ILiveApi} from "../../interfaces/apis/ILiveApi";
import {DataApi} from "../../interfaces/apis/IDataApi";
import {IFeatureApi} from "../../interfaces/apis/IFeatureApi";
import {ConfiguredFeatureDto} from "../../interfaces/models/dtos/ConfiguredFeatureDto";

describe('AdminHome', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    const dataApi = api<DataApi>({
        tables: async (): Promise<TableDto[]> => {
            return [];
        }
    });
    const accountApi = api<AccountApi>({
        getAll: async (): Promise<UserDto[]> => {
            return [];
        }
    });
    const templateApi = api<SeasonTemplateApi>({
        getAll: async (): Promise<TemplateDto[]> => {
            return [];
        }
    });
    const liveApi = api<ILiveApi>({
        getAll: async (): Promise<IClientActionResultDto<WebSocketDto[]>> => {
            return {
                success: true,
                result: [],
            };
        }
    });
    const featureApi = api<IFeatureApi>({
        async getFeatures(): Promise<ConfiguredFeatureDto[]> {
            return [];
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function assertTab(access: AccessDto, href: string, exists: boolean) {
        const account: UserDto = {
            access: access,
            name: '',
            givenName: '',
            emailAddress: '',
        };
        context = await renderApp(
            iocProps({dataApi, accountApi, templateApi, liveApi, featureApi}),
            brandingProps(),
            appProps({account}, reportedError),
            (<AdminContainer tables={[]} accounts={[]}>
                <AdminHome/>
            </AdminContainer>),
            '/admin/:mode',
            href);

        const tab = context.container.querySelector(`.nav-tabs .nav-item a[href="${href}"]`);

        reportedError.verifyNoError();
        if (exists) {
            expect(tab).not.toBeNull();
        } else {
            expect(tab).toBeNull();
        }
    }

    async function assertContent(access: AccessDto, address: string, expectContent: string) {
        const account: UserDto = {
            access: access,
            name: '',
            emailAddress: '',
            givenName: '',
        };
        context = await renderApp(
            iocProps({dataApi, accountApi, templateApi, liveApi, featureApi}),
            brandingProps(),
            appProps({
                appLoading: false,
                account: account,
            }, reportedError),
            (<AdminContainer tables={[]} accounts={[]}>
                <AdminHome/>
            </AdminContainer>),
            '/admin/:mode',
            address
        );

        reportedError.verifyNoError();
        const content = context.container.querySelector(`div.content-background`);
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain(expectContent);
    }

    describe('user admin', () => {
        it('shows user admin if permitted', async () => {
            await assertTab({
                manageAccess: true
            }, '/admin/user', true);
        });

        it('excludes user admin if not permitted', async () => {
            await assertTab({
                manageAccess: false
            }, '/admin/user', false);
        });

        it('renders the user admin content', async () => {
            await assertContent({
                    manageAccess: true
                },
                '/admin/user',
                'Manage access');
        });
    });

    describe('import', () => {
        it('shows import if permitted', async () => {
            await assertTab({
                importData: true
            }, '/admin/import', true);
        });

        it('excludes import if not permitted', async () => {
            await assertTab({
                importData: false
            }, '/admin/import', false);
        });

        it('renders the import data content', async () => {
            await assertContent({
                    importData: true
                },
                '/admin/import',
                'Import data');
        });
    });

    describe('export', () => {
        it('shows export if permitted', async () => {
            await assertTab({
                exportData: true
            }, '/admin/export', true);
        });

        it('excludes export if not permitted', async () => {
            await assertTab({
                exportData: false
            }, '/admin/export', false);
        });

        it('renders the export data content', async () => {
            await assertContent({
                    exportData: true
                },
                '/admin/export',
                'Export data');
        });
    });

    describe('errors', () => {
        it('shows view errors if permitted', async () => {
            await assertTab({
                viewExceptions: true
            }, '/admin/errors', true);
        });

        it('excludes view errors if not permitted', async () => {
            await assertTab({
                viewExceptions: false
            }, '/admin/errors', false);
        });

        it('renders the errors content', async () => {
            await assertContent({
                    viewExceptions: true
                },
                '/admin/errors',
                'View recent errors');
        });
    });

    describe('template admin', () => {
        it('shows template admin if permitted', async () => {
            await assertTab({
                manageSeasonTemplates: true
            }, '/admin/templates', true);
        });

        it('excludes template admin if not permitted', async () => {
            await assertTab({
                manageSeasonTemplates: false
            }, '/admin/templates', false);
        });

        it('renders the templates content', async () => {
            await assertContent({
                    manageSeasonTemplates: true
                },
                '/admin/templates',
                'Manage templates');
        });
    });

    describe('socket admin', () => {
        it('shows socket admin if permitted', async () => {
            await assertTab({
                manageSockets: true
            }, '/admin/sockets', true);
        });

        it('excludes socket admin if not permitted', async () => {
            await assertTab({
                manageSockets: false
            }, '/admin/sockets', false);
        });

        it('renders the socket admin content', async () => {
            await assertContent({
                    manageSockets: true
                },
                '/admin/sockets',
                'Manage sockets');
        });
    });

    describe('data browser', () => {
        it('shows browser if permitted', async () => {
            await assertTab({
                exportData: true
            }, '/admin/browser', true);
        });

        it('excludes browser if not permitted', async () => {
            await assertTab({
                exportData: false
            }, '/admin/browser', false);
        });

        it('renders the browser data content', async () => {
            await assertContent({
                    exportData: true
                },
                '/admin/browser',
                'Data Browser');
        });
    });

    describe('features', () => {
        it('shows features if permitted', async () => {
            await assertTab({
                manageFeatures: true
            }, '/admin/features', true);
        });

        it('excludes features if not permitted', async () => {
            await assertTab({
                manageFeatures: false
            }, '/admin/features', false);
        });

        it('renders the features data content', async () => {
            await assertContent({
                    manageFeatures: true
                },
                '/admin/features',
                'Manage features');
        });
    });

    it('shows loading when appLoading', async () => {
        context = await renderApp(
            iocProps({dataApi, accountApi, templateApi, liveApi}),
            brandingProps(),
            appProps({appLoading: true}),
            (<AdminContainer tables={[]} accounts={[]}>
                <AdminHome/>
            </AdminContainer>));

        const loading = context.container.querySelector('.loading-background');
        expect(loading).not.toBeNull();
    });

    it('shows not permitted when finished loading', async () => {
        context = await renderApp(
            iocProps({dataApi, accountApi, templateApi, liveApi}),
            brandingProps(),
            appProps({account: null, appLoading: false}),
            (<AdminContainer tables={[]} accounts={[]}>
                <AdminHome/>
            </AdminContainer>));

        const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
        expect(tabs.length).toEqual(0);
        expect(context.container.outerHTML).toContain('You\'re not permitted to use this function');
    });
});