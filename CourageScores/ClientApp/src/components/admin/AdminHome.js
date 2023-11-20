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

export function AdminHome() {
    const {mode} = useParams();
    const {dataApi, accountApi} = useDependencies();
    const {account, appLoading, onError} = useApp();
    const effectiveTab = mode || 'user';
    const access = (account ? account.access : null) || {};
    const [dataTables, setDataTables] = useState(null);
    const [accounts, setAccounts] = useState(null);
    const [adminLoading, setAdminLoading] = useState(true);

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
        [])

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
            </ul>) : null}
            {!appLoading && adminLoading ? <Loading/> : (<AdminContainer tables={dataTables} accounts={accounts}>
                {!account && !appLoading ? (<NotPermitted/>) : null}
                {!appLoading && access.manageAccess && effectiveTab === 'user' ? (<UserAdmin/>) : null}
                {!appLoading && access.importData && effectiveTab === 'import' ? (<ImportData/>) : null}
                {!appLoading && access.exportData && effectiveTab === 'export' ? (<ExportData/>) : null}
                {!appLoading && access.viewExceptions && effectiveTab === 'errors' ? (<Errors/>) : null}
                {!appLoading && access.manageSeasonTemplates && effectiveTab === 'templates' ? (<Templates/>) : null}
                {!appLoading && access.manageSockets && effectiveTab === 'sockets' ? (<SocketAdmin/>) : null}
            </AdminContainer>)}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}