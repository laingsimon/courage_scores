import React from "react";
import ReactDOM from "react-dom/client";
import {AdminHome} from "./AdminHome";
import {act} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from 'react-router-dom';

describe('AdminHome', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    })

    afterEach(() => {
        document.body.removeChild(container);
        container = null;
    })

    function assertTab(access, href, exists) {
        const account = {
            access: access
        };
        const component = (<MemoryRouter>
            <AdminHome appLoading={false} account={account} />
        </MemoryRouter>);
        act(() => {
            ReactDOM.createRoot(container).render(component);
        });

        const tab = container.querySelector(`.nav-tabs .nav-item a[href="${href}"]`);
        if (exists) {
            expect(tab).not.toBeNull();
        } else {
            expect(tab).toBeNull();
        }
    }

    function assertContent(access, address, expectContent) {
        const account = {
            access: access
        };
        const component = (<MemoryRouter initialEntries={[address]}>
            <Routes>
                <Route path="/admin/:mode" element={<AdminHome account={account} appLoading={false} />} />
            </Routes>
        </MemoryRouter>);
        act(() => {
            ReactDOM.createRoot(container).render(component);
        });

        const content = container.querySelector(`div.light-background`);
        expect(content).not.toBeNull();
        expect(content.innerHTML).toContain(expectContent);
    }

    it('shows loading when appLoading', () => {
        const component = (<AdminHome appLoading={true} />);
        act(() => {
            ReactDOM.createRoot(container).render(component);
        });

        const loading = container.querySelector('.loading-background');
        expect(loading).not.toBeNull();
    });

    it('shows not permitted when finished loading', () => {
        const component = (<AdminHome appLoading={false} account={null} />);
        act(() => {
            ReactDOM.createRoot(container).render(component);
        });

        const tabs = Array.from(container.querySelectorAll('.nav-tabs .nav-item'));
        expect(tabs.length).toEqual(0);
        expect(container.outerHTML).toContain('You\'re not permitted to use this function');
    });

    it('shows user admin if permitted', () => {
        assertTab({
            manageAccess: true
        }, '/admin/user', true);
    });

    it('excludes user admin if not permitted', () => {
        assertTab({
            manageAccess: false
        }, '/admin/user', false);
    });

    it('shows import if permitted', () => {
        assertTab({
            importData: true
        }, '/admin/import', true);
    });

    it('excludes import if not permitted', () => {
        assertTab({
            importData: false
        }, '/admin/import', false);
    });

    it('shows export if permitted', () => {
        assertTab({
            exportData: true
        }, '/admin/export', true);
    });

    it('excludes export if not permitted', () => {
        assertTab({
            exportData: false
        }, '/admin/export', false);
    });

    it('shows view errors if permitted', () => {
        assertTab({
            viewExceptions: true
        }, '/admin/errors', true);
    });

    it('excludes view errors if not permitted', () => {
        assertTab({
            viewExceptions: false
        }, '/admin/errors', false);
    });

    it('renders the user admin content', () => {
        assertContent({
                manageAccess: true
            },
            '/admin/user',
            'Manage access');
    });

    it('renders the import data content', () => {
        assertContent({
                importData: true
            },
            '/admin/import',
            'Import data');
    });

    it('renders the export data content', () => {
        assertContent({
                exportData: true
            },
            '/admin/export',
            'Export data');
    });

    it('renders the errors content', () => {
        assertContent({
                viewExceptions: true
            },
            '/admin/errors',
            'View recent errors');
    });
});