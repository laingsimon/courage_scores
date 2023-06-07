// noinspection JSUnresolvedFunction

import React from "react";
import {AdminHome} from "./AdminHome";
import {AdminContainer} from "./AdminContainer";
import {renderApp,cleanUp} from "../../helpers/tests";

describe('AdminHome', () => {
    let container;
    let context;
    let mockDataApi;
    let mockAccountApi;

    beforeEach(() => {
        mockDataApi = {
            tables: async () => {
                return [];
            }
        };

        mockAccountApi = {
            getAll: async () => {
                return [];
            }
        }

        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function assertTab(access, href, exists) {
        const account = {
            access: access
        };

        context = await renderApp(
            { dataApi: mockDataApi, accountApi: mockAccountApi },
            { account: account, appLoading: false},
            (<AdminContainer>
                <AdminHome />
            </AdminContainer>));

        const tab = context.container.querySelector(`.nav-tabs .nav-item a[href="${href}"]`);
        if (exists) {
            expect(tab).not.toBeNull();
        } else {
            expect(tab).toBeNull();
        }
    }

    async function assertContent(access, address, expectContent) {
        const account = {
            access: access
        };
        context = await renderApp(
            { dataApi: mockDataApi, accountApi: mockAccountApi },
            { appLoading: false, account: account },
            (<AdminContainer>
                <AdminHome />
            </AdminContainer>),
            '/admin/:mode',
            address
        );
        const content = context.container.querySelector(`div.light-background`);
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain(expectContent);
    }

    it('shows loading when appLoading', async () => {
        context = await renderApp(
            { dataApi: mockDataApi, accountApi: mockAccountApi },
            { appLoading: true },
            (<AdminContainer>
                <AdminHome />
            </AdminContainer>));

        const loading = context.container.querySelector('.loading-background');
        expect(loading).not.toBeNull();
    });

    it('shows not permitted when finished loading', async () => {
        context = await renderApp(
            { dataApi: mockDataApi, accountApi: mockAccountApi },
            { account: null, appLoading: false},
            (<AdminContainer>
                <AdminHome />
            </AdminContainer>));

        const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
        expect(tabs.length).toEqual(0);
        expect(context.container.outerHTML).toContain('You\'re not permitted to use this function');
    });

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

    it('renders the user admin content', async () => {
        await assertContent({
                manageAccess: true
            },
            '/admin/user',
            'Manage access');
    });

    it('renders the import data content', async () => {
        await assertContent({
                importData: true
            },
            '/admin/import',
            'Import data');
    });

    it('renders the export data content', async () => {
        await assertContent({
                exportData: true
            },
            '/admin/export',
            'Export data');
    });

    it('renders the errors content', async () => {
        await assertContent({
                viewExceptions: true
            },
            '/admin/errors',
            'View recent errors');
    });
});