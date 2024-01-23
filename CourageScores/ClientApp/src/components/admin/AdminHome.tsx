import React, {useEffect, useState} from 'react';
import {Link, useParams} from "react-router-dom";
import {NavLink} from "reactstrap";
import {UserAdmin} from "./UserAdmin";
import {ImportData} from "./ImportData";
import {ExportData} from "./ExportData";
import {Loading} from "../common/Loading";
import {NotPermitted} from "./NotPermitted";
import {Errors} from "./Errors";
import {useApp} from "../../AppContainer";
import {useDependencies} from "../../IocContainer";
import {AdminContainer} from "./AdminContainer";
import {Templates} from "./Templates";
import {SocketAdmin} from "./SocketAdmin";
import {DataBrowser} from "./DataBrowser";
import {ITableDto} from "../../interfaces/serverSide/Data/ITableDto";
import {IUserDto} from "../../interfaces/serverSide/Identity/IUserDto";

export function AdminHome() {
    const {mode} = useParams();
    const {dataApi, accountApi} = useDependencies();
    const {account, appLoading, onError} = useApp();
    const effectiveTab = mode || 'user';
    const access = (account ? account.access : null) || {};
    const [dataTables, setDataTables] = useState<ITableDto[] | null>(null);
    const [accounts, setAccounts] = useState<IUserDto[] | null>(null);
    const [adminLoading, setAdminLoading] = useState<boolean>(true);

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

    useEffect(() => {
            // noinspection JSIgnoredPromiseFromCall
            loadTables();
        },
        // eslint-disable-next-line
        []);

    function renderIfPermitted(component: React.ReactNode, permitted: boolean) {
        if (!account) {
            return null;
        }

        return permitted
            ? component
            : (<NotPermitted/>);
    }

    try {
        return (<div>
            {appLoading ? (<Loading/>) : null}
            {!appLoading && account ? (<ul className="nav nav-tabs">
                {access.manageAccess ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'user' ? ' active' : ''}
                             to={`/admin/user`}>User admin</NavLink>
                </li>) : null}
                {access.importData ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'import' ? ' active' : ''}
                             to={`/admin/import`}>Import data</NavLink>
                </li>) : null}
                {access.exportData ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'export' ? ' active' : ''}
                             to={`/admin/export`}>Export data</NavLink>
                </li>) : null}
                {access.viewExceptions ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'errors' ? '  active' : ''}
                             to={`/admin/errors`}>Errors</NavLink>
                </li>) : null}
                {access.manageSeasonTemplates ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'templates' ? '  active' : ''}
                             to={`/admin/templates`}>Templates</NavLink>
                </li>) : null}
                {access.manageSockets ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'sockets' ? '  active' : ''}
                             to={`/admin/sockets`}>Sockets</NavLink>
                </li>) : null}
                {access.exportData ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'browser' ? '  active' : ''}
                             to={`/admin/browser`}>Data Browser</NavLink>
                </li>) : null}
            </ul>) : null}
            {!appLoading && adminLoading ? <Loading/> : (<AdminContainer tables={dataTables} accounts={accounts}>
                {!account && !appLoading ? (<NotPermitted/>) : null}
                {!appLoading && effectiveTab === 'user' ? renderIfPermitted(<UserAdmin/>, access.manageAccess) : null}
                {!appLoading && effectiveTab === 'import' ? renderIfPermitted(<ImportData/>, access.importData) : null}
                {!appLoading && effectiveTab === 'export' ? renderIfPermitted(<ExportData/>, access.exportData) : null}
                {!appLoading && effectiveTab === 'errors' ? renderIfPermitted(<Errors/>, access.viewExceptions) : null}
                {!appLoading && effectiveTab === 'templates' ? renderIfPermitted(<Templates/>, access.manageSeasonTemplates) : null}
                {!appLoading && effectiveTab === 'sockets' ? renderIfPermitted(<SocketAdmin/>, access.manageSockets) : null}
                {!appLoading && effectiveTab === 'browser' ? renderIfPermitted(<DataBrowser />, access.exportData) : null}
            </AdminContainer>)}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}