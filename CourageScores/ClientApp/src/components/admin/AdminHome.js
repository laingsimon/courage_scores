import React from 'react';
import {Link, useParams} from "react-router-dom";
import {NavLink} from "reactstrap";
import {UserAdmin} from "./UserAdmin";
import {ImportData} from "./ImportData";
import {ExportData} from "./ExportData";
import {Loading} from "../common/Loading";
import {NotPermitted} from "./NotPermitted";
import {Errors} from "./Errors";

export function AdminHome({ account, appLoading }) {
    const { mode } = useParams();
    const effectiveTab = mode || 'user';
    const access = (account ? account.access : null) || {};

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
        {!account && !appLoading ? (<NotPermitted />) : null}
        {!appLoading && access.manageAccess && effectiveTab === 'user' ? (<UserAdmin account={account} />): null}
        {!appLoading && access.importData && effectiveTab === 'import' ? (<ImportData account={account} />) : null}
        {!appLoading && access.exportData && effectiveTab === 'export' ? (<ExportData account={account} />) : null}
        {!appLoading && access.viewExceptions && effectiveTab === 'errors' ? (<Errors account={account} />) : null}
    </div>);
}