import React, {useEffect, useState} from 'react';
import {Collapse, Navbar, NavbarBrand, NavbarToggler, NavLink} from 'reactstrap';
import {Link, useLocation} from 'react-router-dom';
import './NavMenu.css';
import {any, isEmpty} from "../../helpers/collections";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useBranding} from "../../BrandingContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";

export function NavMenu() {
    const {settings} = useDependencies();
    const {menu} = useBranding();
    const {account, clearError, divisions, appLoading, seasons} = useApp();
    const [collapsed, setCollapsed] = useState(true);
    const [navMenuError, setNavMenuError] = useState(null);
    const [currentLink, setCurrentLink] = useState(document.location.href);
    const location = useLocation();

    useEffect(() => {
        setCurrentLink('https://' + document.location.host + location.pathname);
        setCollapsed(true);
    }, [location]);

    function isActive(toRegex) {
        return decodeURI(currentLink).match(toRegex);
    }

    function getClassName(to) {
        return isActive(to) ? 'nav-item-active' : '';
    }

    function navigate(event) {
        setCurrentLink(event.target.href);
        setCollapsed(true);
        if (clearError) {
            clearError();
        }
    }

    function getAccountUrl(action) {
        return `${settings.apiHost}/api/Account/${action}/?redirectUrl=${currentLink}`;
    }

    function shouldShowDivision(division) {
        const currentSeasons = (seasons || []).filter(s => s.isCurrent === true);
        const currentDivisions = currentSeasons.flatMap(s => s.divisions || []);

        if (isEmpty(currentDivisions)) {
            return true;
        }

        return any(currentDivisions, d => d.id === division.id);
    }

    function hasAdminAccess(access) {
        return access.manageAccess
            || access.viewExceptions
            || access.importData
            || access.exportData;
    }

    function renderMenuItem(menuItem, index, location) {
        if (menuItem.url.startsWith('/')) {
            return (<li key={location + '_' + index} className="nav-item">
                <NavLink tag={Link} className={getClassName(menuItem.url)} onClick={navigate} to={menuItem.url}>
                    {menuItem.text}
                </NavLink>
            </li>);
        }

        return (<li key={location + '_' + index} className="nav-item">
            <NavLink className="nav-link" href={menuItem.url}>{menuItem.text}</NavLink>
        </li>);
    }

    function renderItems(location) {
        if (!menu) {
            return null;
        }

        const items = menu[location] || [];
        return items.map((menuItem, index) => {
            return renderMenuItem(menuItem, index, location);
        });
    }

    function getDivisionAddress(division) {
        const currentSeasons = seasons
            .filter(s => s.isCurrent)
            .filter(s => any(s.divisions, d => d.id === division.id));

        if (currentSeasons.length !== 1) {
            return `/division/${division.name}/${season.id}`;
        }

        const season = currentSeasons[0];
        return `/division/${division.name}/${season.id}`;
    }

    if (navMenuError) {
        return (<div>ERROR: {navMenuError.message}: {navMenuError.stack}</div>)
    }

    try {
        return (<header className="d-print-none" data-state={collapsed ? 'collapsed' : 'expanded'}>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" container>
                <NavbarBrand onClick={() => setCollapsed(!collapsed)} className="me-auto">Menu</NavbarBrand>
                <NavbarToggler onClick={() => setCollapsed(!collapsed)} className="mr-2"/>
                <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                    <ul className="navbar-nav flex-grow">
                        {renderItems('beforeDivisions')}
                        {!appLoading && divisions.filter(shouldShowDivision).map(division => (
                            <li className="nav-item" key={division.id}>
                                <NavLink tag={Link} onClick={navigate}
                                         className={getClassName(`/division/${division.name}`)}
                                         to={`/division/${division.name}`}>
                                    {division.name}
                                </NavLink>
                            </li>))}
                        {renderItems('afterDivisions')}
                        {appLoading ? (<li className="nav-item"><NavLink><LoadingSpinnerSmall/></NavLink></li>) : null}
                        {!appLoading && account && account.access && hasAdminAccess(account.access)
                            ? (<li className="nav-item">
                                <NavLink tag={Link} onClick={navigate} className={getClassName('/admin')} to={`/admin`}>
                                    Admin
                                </NavLink>
                            </li>)
                            : null}
                        {!appLoading ? (<li className="nav-item">
                            {!appLoading && account ?
                                <a className="nav-link" href={`${getAccountUrl('Logout')}`}>Logout
                                    ({account.givenName})</a> : null}
                            {!appLoading && !account ?
                                <a className="nav-link" href={`${getAccountUrl('Login')}`}>Login</a> : null}
                        </li>) : null}
                    </ul>
                </Collapse>
            </Navbar>
        </header>);
    } catch (e) {
        setNavMenuError({
            message: e.message,
            stack: e.stack
        });
    }
}
