import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { UserAdmin } from './UserAdmin.tsx';
import { ImportData } from './ImportData.tsx';
import { ExportData } from './ExportData.tsx';
import { Loading } from '../common/Loading.tsx';
import { NotPermitted } from './NotPermitted.tsx';
import { Errors } from './Errors.tsx';
import { useApp } from '../common/AppContainer.tsx';
import { useDependencies } from '../common/IocContainer.tsx';
import { AdminContainer } from './AdminContainer.tsx';
import { Templates } from './Templates.tsx';
import { SocketAdmin } from './SocketAdmin.tsx';
import { DataBrowser } from './DataBrowser.tsx';
import { TableDto } from '../../interfaces/models/dtos/Data/TableDto.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';
import { FeatureAdmin } from './FeatureAdmin.tsx';
import { useBranding } from '../common/BrandingContainer.tsx';
import { NavLink } from '../common/NavLink.tsx';
import { Query } from './Query.tsx';

export function AdminHome() {
    const { mode } = useParams();
    const { dataApi, accountApi } = useDependencies();
    const { account, appLoading, onError } = useApp();
    const effectiveTab = mode || 'user';
    const access = (account ? account.access : null) || {};
    const [dataTables, setDataTables] = useState<TableDto[] | null>(null);
    const [accounts, setAccounts] = useState<UserDto[] | null>(null);
    const [adminLoading, setAdminLoading] = useState<boolean>(true);
    const { setTitle } = useBranding();

    async function loadTables() {
        try {
            const tables = await dataApi.tables();
            setDataTables(tables);

            const accounts = await accountApi.getAll();
            setAccounts(accounts);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setAdminLoading(false);
        }
    }

    useEffect(
        () => {
            // noinspection JSIgnoredPromiseFromCall
            loadTables();
        },
        // eslint-disable-next-line
        [],
    );

    function renderIfPermitted(
        component: React.ReactNode,
        permitted?: boolean,
    ) {
        if (!account) {
            return null;
        }

        return permitted ? component : <NotPermitted />;
    }

    setTitle('Admin');

    try {
        return (
            <div>
                {appLoading ? <Loading /> : null}
                {!appLoading && account ? (
                    <ul className="nav nav-tabs">
                        {access.manageAccess ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'user' ? ' active' : ''
                                    }
                                    to={`/admin/user`}>
                                    User admin
                                </NavLink>
                            </li>
                        ) : null}
                        {access.importData ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'import'
                                            ? ' active'
                                            : ''
                                    }
                                    to={`/admin/import`}>
                                    Import data
                                </NavLink>
                            </li>
                        ) : null}
                        {access.exportData ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'export'
                                            ? ' active'
                                            : ''
                                    }
                                    to={`/admin/export`}>
                                    Export data
                                </NavLink>
                            </li>
                        ) : null}
                        {access.viewExceptions ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'errors'
                                            ? '  active'
                                            : ''
                                    }
                                    to={`/admin/errors`}>
                                    Errors
                                </NavLink>
                            </li>
                        ) : null}
                        {access.manageSeasonTemplates ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'templates'
                                            ? '  active'
                                            : ''
                                    }
                                    to={`/admin/templates`}>
                                    Templates
                                </NavLink>
                            </li>
                        ) : null}
                        {access.manageSockets ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'sockets'
                                            ? '  active'
                                            : ''
                                    }
                                    to={`/admin/sockets`}>
                                    Sockets
                                </NavLink>
                            </li>
                        ) : null}
                        {access.exportData ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'browser'
                                            ? '  active'
                                            : ''
                                    }
                                    to={`/admin/browser`}>
                                    Data Browser
                                </NavLink>
                            </li>
                        ) : null}
                        {access.manageFeatures ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'features'
                                            ? '  active'
                                            : ''
                                    }
                                    to={`/admin/features`}>
                                    Features
                                </NavLink>
                            </li>
                        ) : null}
                        {access.runDataQueries ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'query'
                                            ? ' active'
                                            : ''
                                    }
                                    to={`/admin/query`}>
                                    Query data
                                </NavLink>
                            </li>
                        ) : null}
                    </ul>
                ) : null}
                {!appLoading && adminLoading ? (
                    <Loading />
                ) : (
                    <AdminContainer tables={dataTables} accounts={accounts}>
                        {!account && !appLoading ? <NotPermitted /> : null}
                        {!appLoading && effectiveTab === 'user'
                            ? renderIfPermitted(
                                  <UserAdmin />,
                                  access.manageAccess,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'import'
                            ? renderIfPermitted(
                                  <ImportData />,
                                  access.importData,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'export'
                            ? renderIfPermitted(
                                  <ExportData />,
                                  access.exportData,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'errors'
                            ? renderIfPermitted(
                                  <Errors />,
                                  access.viewExceptions,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'templates'
                            ? renderIfPermitted(
                                  <Templates />,
                                  access.manageSeasonTemplates,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'sockets'
                            ? renderIfPermitted(
                                  <SocketAdmin />,
                                  access.manageSockets,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'browser'
                            ? renderIfPermitted(
                                  <DataBrowser />,
                                  access.exportData,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'features'
                            ? renderIfPermitted(
                                  <FeatureAdmin />,
                                  access.manageFeatures,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'query'
                            ? renderIfPermitted(
                                  <Query />,
                                  access.runDataQueries,
                              )
                            : null}
                    </AdminContainer>
                )}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
