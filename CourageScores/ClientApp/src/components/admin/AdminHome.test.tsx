import React from "react";
import {AdminHome} from "./AdminHome";
import {AdminContainer} from "./AdminContainer";
import {api, appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {ITableDto} from "../../interfaces/models/dtos/Data/ITableDto";
import {IUserDto} from "../../interfaces/models/dtos/Identity/IUserDto";
import {ITemplateDto} from "../../interfaces/models/dtos/Season/Creation/ITemplateDto";
import {IWebSocketDto} from "../../interfaces/models/dtos/Live/IWebSocketDto";
import {IAccessDto} from "../../interfaces/models/dtos/Identity/IAccessDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IDataApi} from "../../api/data";
import {IAccountApi} from "../../interfaces/apis/AccountApi";
import {ISeasonTemplateApi} from "../../interfaces/apis/SeasonTemplateApi";
import {ILiveApi} from "../../interfaces/apis/LiveApi";

describe('AdminHome', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    const dataApi = api<IDataApi>({
        tables: async (): Promise<ITableDto[]> => {
            return [];
        }
    });
    const accountApi = api<IAccountApi>({
        getAll: async (): Promise<IUserDto[]> => {
            return [];
        }
    });
    const templateApi = api<ISeasonTemplateApi>({
        getAll: async (): Promise<ITemplateDto[]> => {
            return [];
        }
    });
    const liveApi = api<ILiveApi>({
        getAll: async (): Promise<IClientActionResultDto<IWebSocketDto[]>> => {
            return {
                success: true,
                result: [],
            };
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function assertTab(access: IAccessDto, href: string, exists: boolean) {
        const account: IUserDto = {
            access: access,
            name: '',
            givenName: '',
            emailAddress: '',
        };
        context = await renderApp(
            iocProps({dataApi, accountApi, templateApi, liveApi}),
            brandingProps(),
            appProps({account}, reportedError),
            (<AdminContainer tables={[]} accounts={[]}>
                <AdminHome/>
            </AdminContainer>),
            '/admin/:mode',
            href);

        const tab = context.container.querySelector(`.nav-tabs .nav-item a[href="${href}"]`);

        expect(reportedError.hasError()).toEqual(false);
        if (exists) {
            expect(tab).not.toBeNull();
        } else {
            expect(tab).toBeNull();
        }
    }

    async function assertContent(access: IAccessDto, address: string, expectContent: string) {
        const account: IUserDto = {
            access: access,
            name: '',
            emailAddress: '',
            givenName: '',
        };
        context = await renderApp(
            iocProps({dataApi, accountApi, templateApi, liveApi}),
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

        expect(reportedError.hasError()).toEqual(false);
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
        it('shows export if permitted', async () => {
            await assertTab({
                exportData: true
            }, '/admin/browser', true);
        });

        it('excludes export if not permitted', async () => {
            await assertTab({
                exportData: false
            }, '/admin/browser', false);
        });

        it('renders the export data content', async () => {
            await assertContent({
                    exportData: true
                },
                '/admin/browser',
                'Data Browser');
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