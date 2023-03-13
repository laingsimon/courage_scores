import React from "react";
import ReactDOM from "react-dom/client";
import {AdminHome} from "./AdminHome";
import {act} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {AppContainer} from "../../AppContainer";
import {IocContainer} from "../../IocContainer";
import {AdminContainer} from "./AdminContainer";

describe('AdminHome', () => {
    let container;
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
        document.body.removeChild(container);
        container = null;
    });

    async function assertTab(access, href, exists) {
        const account = {
            access: access
        };
        await act(async () => {
            const component = (<MemoryRouter>
                <IocContainer dataApi={mockDataApi} accountApi={mockAccountApi}>
                    <AppContainer account={account} appLoading={false}>
                        <AdminContainer>
                            <AdminHome />
                        </AdminContainer>
                    </AppContainer>
                </IocContainer>
            </MemoryRouter>);
            ReactDOM.createRoot(container).render(component);
        });

        const tab = container.querySelector(`.nav-tabs .nav-item a[href="${href}"]`);
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
        await act(async () => {
            const component = (<MemoryRouter initialEntries={[address]}>
                <Routes>
                    <Route path="/admin/:mode" element={
                        <IocContainer dataApi={mockDataApi} accountApi={mockAccountApi}>
                            <AppContainer appLoading={false} account={account}>
                                <AdminContainer>
                                    <AdminHome />
                                </AdminContainer>
                            </AppContainer>
                        </IocContainer>} />
                </Routes>
            </MemoryRouter>);
            ReactDOM.createRoot(container).render(component);
        });

        const content = container.querySelector(`div.light-background`);
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain(expectContent);
    }

    it('shows loading when appLoading', async () => {
        await act(async () => {
            const component = (<IocContainer dataApi={mockDataApi} accountApi={mockAccountApi}>
                <AppContainer appLoading={true}>
                    <AdminContainer>
                        <AdminHome />
                    </AdminContainer>
                </AppContainer>
            </IocContainer>);
            ReactDOM.createRoot(container).render(component);
        });

        const loading = container.querySelector('.loading-background');
        expect(loading).not.toBeNull();
    });

    it('shows not permitted when finished loading', async () => {
        await act(async () => {
            const component = (<IocContainer dataApi={mockDataApi} accountApi={mockAccountApi}>
                <AppContainer appLoading={false} account={null}>
                    <AdminContainer >
                        <AdminHome />
                    </AdminContainer>
                </AppContainer>
            </IocContainer>);
            ReactDOM.createRoot(container).render(component);
        });

        const tabs = Array.from(container.querySelectorAll('.nav-tabs .nav-item'));
        expect(tabs.length).toEqual(0);
        expect(container.outerHTML).toContain('You\'re not permitted to use this function');
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