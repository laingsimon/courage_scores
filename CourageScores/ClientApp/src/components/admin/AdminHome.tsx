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
import { hasAccess } from '../../helpers/conditions.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

export function AdminHome() {
    const { mode } = useParams();
    const { dataApi, accountApi } = useDependencies();
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
        permitted?: boolean,
    ) {
        if (!account) {
            return null;
        }

        return permitted ? component : <NotPermitted />;
    }

    function renderTab(
        permitted: boolean | undefined,
        route: string,
        title: string,
    ) {
        return permitted ? (
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
                            hasAccess(account, AccessOption.manageAccess),
                            'user',
                            'User admin',
                        )}
                        {renderTab(
                            hasAccess(account, AccessOption.importData),
                            'import',
                            'Import data',
                        )}
                        {renderTab(
                            hasAccess(account, AccessOption.exportData),
                            'export',
                            'Export data',
                        )}
                        {renderTab(
                            hasAccess(account, AccessOption.viewExceptions),
                            'errors',
                            'Errors',
                        )}
                        {renderTab(
                            hasAccess(
                                account,
                                AccessOption.manageSeasonTemplates,
                            ),
                            'templates',
                            'Templates',
                        )}
                        {renderTab(
                            hasAccess(account, AccessOption.manageSockets),
                            'sockets',
                            'Sockets',
                        )}
                        {renderTab(
                            hasAccess(account, AccessOption.exportData),
                            'browser',
                            'Data Browser',
                        )}
                        {renderTab(
                            hasAccess(account, AccessOption.manageFeatures),
                            'features',
                            'Features',
                        )}
                        {renderTab(
                            hasAccess(account, AccessOption.runDataQueries),
                            'query',
                            'Query data',
                        )}
                        {renderTab(
                            hasAccess(
                                account,
                                AccessOption.loginServiceAccounts,
                            ),
                            'service_accounts',
                            'Service accounts',
                        )}
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
                                  hasAccess(account, AccessOption.manageAccess),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'import'
                            ? renderIfPermitted(
                                  <ImportData />,
                                  hasAccess(account, AccessOption.importData),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'export'
                            ? renderIfPermitted(
                                  <ExportData />,
                                  hasAccess(account, AccessOption.exportData),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'errors'
                            ? renderIfPermitted(
                                  <Errors />,
                                  hasAccess(
                                      account,
                                      AccessOption.viewExceptions,
                                  ),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'templates'
                            ? renderIfPermitted(
                                  <Templates />,
                                  hasAccess(
                                      account,
                                      AccessOption.manageSeasonTemplates,
                                  ),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'sockets'
                            ? renderIfPermitted(
                                  <SocketAdmin />,
                                  hasAccess(
                                      account,
                                      AccessOption.manageSockets,
                                  ),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'browser'
                            ? renderIfPermitted(
                                  <DataBrowser />,
                                  hasAccess(account, AccessOption.exportData),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'features'
                            ? renderIfPermitted(
                                  <FeatureAdmin />,
                                  hasAccess(
                                      account,
                                      AccessOption.manageFeatures,
                                  ),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'query'
                            ? renderIfPermitted(
                                  <Query />,
                                  hasAccess(
                                      account,
                                      AccessOption.runDataQueries,
                                  ),
                              )
                            : null}
                        {!appLoading && effectiveTab === 'service_accounts'
                            ? renderIfPermitted(
                                  <ServiceAccountSessions />,
                                  hasAccess(
                                      account,
                                      AccessOption.loginServiceAccounts,
                                  ),
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
