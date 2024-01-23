import React, {useEffect, useState} from 'react';
import {Collapse, Navbar, NavbarBrand, NavLink} from 'reactstrap';
import {Link, useLocation} from 'react-router-dom';
import './NavMenu.css';
import {any, isEmpty} from "../../helpers/collections";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useBranding} from "../../BrandingContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {IMenuItem} from "../../interfaces/IMenuItem";
import {IDivisionDto} from "../../interfaces/serverSide/IDivisionDto";
import {ISeasonDto} from "../../interfaces/serverSide/Season/ISeasonDto";
import {IAccessDto} from "../../interfaces/serverSide/Identity/IAccessDto";
import {IError} from "../../interfaces/IError";

export function NavMenu() {
    const {settings} = useDependencies();
    const {menu} = useBranding();
    const {account, clearError, divisions, appLoading, seasons} = useApp();
    const [collapsed, setCollapsed] = useState<boolean>(true);
    const [navMenuError, setNavMenuError] = useState<IError | null>(null);
    const [currentLink, setCurrentLink] = useState<string>(document.location.href);
    const location = useLocation();

    useEffect(() => {
        setCurrentLink('https://' + document.location.host + location.pathname);
        setCollapsed(true);
    }, [location]);

    function isActive(toRegex: string) {
        return decodeURI(currentLink).match(toRegex);
    }

    function getClassName(to: string) {
        return isActive(to) ? 'nav-item-active' : '';
    }

    function navigate(event: any) {
        setCurrentLink(event.target.href);
        setCollapsed(true);
        if (clearError) {
            clearError();
        }
    }

    function getAccountUrl(action: string) {
        return `${settings.apiHost}/api/Account/${action}/?redirectUrl=${currentLink}`;
    }

    function shouldShowDivision(division: IDivisionDto) {
        const currentSeasons = (seasons || []).filter((s: ISeasonDto) => s.isCurrent === true);
        const currentDivisions = currentSeasons.flatMap((s: ISeasonDto) => s.divisions || []);

        if (isEmpty(currentDivisions)) {
            return true;
        }

        return any(currentDivisions, (d: IDivisionDto) => d.id === division.id);
    }

    function hasAdminAccess(access: IAccessDto) {
        return access.manageAccess
            || access.viewExceptions
            || access.importData
            || access.exportData;
    }

    function renderMenuItem(menuItem: IMenuItem, index: number, location: string) {
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

    function renderItems(location: string) {
        if (!menu) {
            return null;
        }

        const items = menu[location] || [];
        return items.map((menuItem: IMenuItem, index: number) => {
            return renderMenuItem(menuItem, index, location);
        });
    }

    function getDivisionAddress(division: IDivisionDto) {
        const currentSeasons = seasons
            .filter((s: ISeasonDto) => s.isCurrent)
            .filter((s: ISeasonDto) => any(s.divisions, (d: IDivisionDto) => d.id === division.id));

        if (currentSeasons.length !== 1) {
            return `/division/${division.name}`;
        }

        const season = currentSeasons[0];
        return `/division/${division.name}/teams/${season.name}`;
    }

    if (navMenuError) {
        return (<div>ERROR: {navMenuError.message}: {navMenuError.stack}</div>)
    }

    try {
        return (<header className="d-print-none" data-state={collapsed ? 'collapsed' : 'expanded'}>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" container>
                <NavbarBrand onClick={() => setCollapsed(!collapsed)} className="me-auto">Menu</NavbarBrand>
                <button onClick={() => setCollapsed(!collapsed)} type="button" className="mr-2 navbar-toggler">
                    {appLoading
                        ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>)
                        : (<span className="navbar-toggler-icon"></span>)}
                </button>
                <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                    <ul className="navbar-nav flex-grow">
                        {renderItems('beforeDivisions')}
                        {!appLoading && divisions.filter(shouldShowDivision).map((division: IDivisionDto) => (
                            <li className="nav-item" key={division.id}>
                                <NavLink tag={Link} onClick={navigate}
                                         className={getClassName(`/division/${ division.name}`)}
                                         to={getDivisionAddress(division)}>
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
        const error: Error = e as Error;

        setNavMenuError({
            message: error.message,
            stack: error.stack
        });
    }
}
