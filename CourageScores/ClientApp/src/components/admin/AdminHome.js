import React from 'react';
import {Link, useParams} from "react-router-dom";
import {NavItem, NavLink} from "reactstrap";
import {UserAdmin} from "./UserAdmin";
import {ImportData} from "./ImportData";
import {ExportData} from "./ExportData";
import {Loading} from "../common/Loading";
import {NotPermitted} from "./NotPermitted";

export function AdminHome({ account, appLoading }) {
    const { mode } = useParams();
    const effectiveTab = mode || 'user';
    const access = (account ? account.access : null) || {};

    return (<div>
        {appLoading ? (<Loading />) : null}
        {!appLoading && account ? (<ul className="nav nav-tabs">
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'user' ? ' text-dark active' : 'text-light'} to={`/admin/user`}>User admin</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'import' ? ' text-dark active' : 'text-light'} to={`/admin/import`}>Import data</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'export' ? ' text-dark active' : 'text-light'} to={`/admin/export`}>Export data</NavLink>
            </NavItem>
        </ul>) : null}
        {!account && !appLoading ? (<NotPermitted />) : null}
        {!appLoading && access.manageAccess && effectiveTab === 'user' ? (<UserAdmin account={account} />): null}
        {!appLoading && access.importData && effectiveTab === 'import' ? (<ImportData account={account} />) : null}
        {!appLoading && access.exportData && effectiveTab === 'export' ? (<ExportData account={account} />) : null}
    </div>);
}