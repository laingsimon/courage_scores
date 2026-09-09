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
import { ServiceAccountSessions } from './ServiceAccountSessions.tsx';
import { hasAccessLevel } from '../../helpers/conditions.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

export function AdminHome() {
    const { mode } = useParams();
    const { dataApi, accountApi, settings } = useDependencies();
    const { account, appLoading, onError } = useApp();
    const effectiveTab = mode || 'user';
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
        option: AccessOption,
    ) {
        if (!account) {
            return null;
        }

        const permitted = hasAccessLevel(account, { option });
        return permitted ? component : <NotPermitted />;
    }

    function renderTab(option: AccessOption, route: string, title: string) {
        return hasAccessLevel(account, { option }) ? (
            <li className="nav-item">
                <NavLink
                    className={effectiveTab === route ? ' active' : ''}
                    to={`/admin/${route}`}>
                    {title}
                </NavLink>
            </li>
        ) : null;
    }

    setTitle('Admin');

    try {
        return (
            <div>
                {appLoading ? <Loading /> : null}
                {!appLoading && account ? (
                    <ul className="nav nav-tabs">
                        {renderTab(
                            AccessOption.manageAccess,
                            'user',
                            'User admin',
                        )}
                        {renderTab(
                            AccessOption.importData,
                            'import',
                            'Import data',
                        )}
                        {renderTab(
                            AccessOption.exportData,
                            'export',
                            'Export data',
                        )}
                        {renderTab(
                            AccessOption.viewExceptions,
                            'errors',
                            'Errors',
                        )}
                        {renderTab(
                            AccessOption.manageSeasonTemplates,
                            'templates',
                            'Templates',
                        )}
                        {renderTab(
                            AccessOption.manageSockets,
                            'sockets',
                            'Sockets',
                        )}
                        {renderTab(
                            AccessOption.exportData,
                            'browser',
                            'Data Browser',
                        )}
                        {renderTab(
                            AccessOption.manageFeatures,
                            'features',
                            'Features',
                        )}
                        {renderTab(
                            AccessOption.runDataQueries,
                            'query',
                            'Query data',
                        )}
                        {renderTab(
                            AccessOption.loginServiceAccounts,
                            'service_accounts',
                            'Service accounts',
                        )}
                        <li className="nav-item">
                            <a
                                className="nav-link bg-danger"
                                target="_blank"
                                rel="noopener"
                                href={`${settings.apiHost}/api/ClearCache`}>
                                🚨 Clear cache
                            </a>
                        </li>
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
                                  AccessOption.manageAccess,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'import'
                            ? renderIfPermitted(
                                  <ImportData />,
                                  AccessOption.importData,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'export'
                            ? renderIfPermitted(
                                  <ExportData />,
                                  AccessOption.exportData,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'errors'
                            ? renderIfPermitted(
                                  <Errors />,
                                  AccessOption.viewExceptions,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'templates'
                            ? renderIfPermitted(
                                  <Templates />,
                                  AccessOption.manageSeasonTemplates,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'sockets'
                            ? renderIfPermitted(
                                  <SocketAdmin />,
                                  AccessOption.manageSockets,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'browser'
                            ? renderIfPermitted(
                                  <DataBrowser />,
                                  AccessOption.exportData,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'features'
                            ? renderIfPermitted(
                                  <FeatureAdmin />,
                                  AccessOption.manageFeatures,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'query'
                            ? renderIfPermitted(
                                  <Query />,
                                  AccessOption.runDataQueries,
                              )
                            : null}
                        {!appLoading && effectiveTab === 'service_accounts'
                            ? renderIfPermitted(
                                  <ServiceAccountSessions />,
                                  AccessOption.loginServiceAccounts,
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
