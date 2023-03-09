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

export function AdminHome() {
    const { mode } = useParams();
    const { dataApi, accountApi } = useDependencies();
    const { account, appLoading } = useApp();
    const effectiveTab = mode || 'user';
    const access = (account ? account.access : null) || {};
    const [ dataTables, setDataTables ] = useState(null);
    const [ accounts, setAccounts ] = useState(null);

    async function loadTables() {
        const tables = await dataApi.tables();
        setDataTables(tables);

        const accounts = await accountApi.getAll();
        setAccounts(accounts);
    }

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        loadTables();
    },
    // eslint-disable-next-line
    [])

    return (<div>
        {appLoading ? (<Loading />) : null}
        {!appLoading && account ? (<ul className="nav nav-tabs">
            {access.manageAccess ? (<li className="nav-item">
                <NavLink tag={Link} className={effectiveTab === 'user' ? ' text-dark active' : 'text-light'} to={`/admin/user`}>User admin</NavLink>
            </li>) : null}
            {access.importData ? (<li className="nav-item">
                <NavLink tag={Link} className={effectiveTab === 'import' ? ' text-dark active' : 'text-light'} to={`/admin/import`}>Import data</NavLink>
            </li>) : null}
            {access.exportData ? (<li className="nav-item">
                <NavLink tag={Link} className={effectiveTab === 'export' ? ' text-dark active' : 'text-light'} to={`/admin/export`}>Export data</NavLink>
            </li>) : null}
            {access.viewExceptions ? (<li className="nav-item">
                <NavLink tag={Link} className={effectiveTab === 'errors' ? ' text-dark active' : 'text-light'} to={`/admin/errors`}>Errors</NavLink>
            </li>) : null}
        </ul>) : null}
        <AdminContainer tables={dataTables} accounts={accounts}>
            {!account && !appLoading ? (<NotPermitted />) : null}
            {!appLoading && access.manageAccess && effectiveTab === 'user' ? (<UserAdmin />): null}
            {!appLoading && access.importData && effectiveTab === 'import' ? (<ImportData />) : null}
            {!appLoading && access.exportData && effectiveTab === 'export' ? (<ExportData />) : null}
            {!appLoading && access.viewExceptions && effectiveTab === 'errors' ? (<Errors />) : null}
        </AdminContainer>
    </div>);
}