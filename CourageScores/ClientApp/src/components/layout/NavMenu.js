import React, {useEffect, useState} from 'react';
import {Collapse, Navbar, NavbarBrand, NavbarToggler, NavLink} from 'reactstrap';
import {Link, useLocation, useParams} from 'react-router-dom';
import './NavMenu.css';
import {any, isEmpty} from "../../Utilities";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";

export function NavMenu() {
    const [collapsed, setCollapsed] = useState(true);
    const [navMenuError, setNavMenuError] = useState(null);
    const [ currentLink, setCurrentLink ] = useState(document.location.href);
    const location = useLocation();
    const { seasonId } = useParams();
    const { settings } = useDependencies();
    const { account, clearError, divisions, appLoading, seasons } = useApp();

    useEffect(() => {
        setCurrentLink('https://' + document.location.host + location.pathname);
        setCollapsed(true);
    }, [location]);

    function isActive(toRegex) {
        return currentLink.match(toRegex);
    }

    function getClassName(to) {
        return isActive(to) ? 'text-light nav-item-active' : 'text-light';
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

    function getCurrentSeasonId() {
        const currentSeason = seasons.filter(s => s.isCurrent === true)[0];
        return currentSeason ? currentSeason.id : null;
    }

    function shouldShowDivision(division) {
        const currentSeasonId = seasonId || getCurrentSeasonId();

        if (!currentSeasonId) {
            return true;
        }

        const currentSeason = seasons.filter(s => s.id === currentSeasonId)[0];
        if (!currentSeason || isEmpty(currentSeason.divisions)) {
            return true;
        }

        return any(currentSeason.divisions, d => d.id === division.id);
    }

    if (navMenuError) {
        return (<div>ERROR: {navMenuError.message}: {navMenuError.stack}</div>)
    }

    try {
        return (<header className="d-print-none">
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" container
                    dark>
                <NavbarBrand onClick={() => setCollapsed(!collapsed)} className="me-auto">Menu</NavbarBrand>
                <NavbarToggler onClick={() => setCollapsed(!collapsed)} className="mr-2"/>
                <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                    <ul className="navbar-nav flex-grow">
                        <li className="nav-item">
                            <NavLink className="nav-link text-light"
                                     href="http://thecourageleague.co.uk/">Home</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link text-light"
                                     href="http://thecourageleague.co.uk/?cat=13">News</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink tag={Link} className="nav-link text-light" onClick={navigate} to={`/sayg`}>
                                Practice
                            </NavLink>
                        </li>
                        {divisions.filter(shouldShowDivision).map(division => (
                            <li className="nav-item" key={division.id}>
                                <NavLink tag={Link} onClick={navigate}
                                         className={getClassName(`/division/${division.id}`)}
                                         to={`/division/${division.id}`}>
                                    {division.name}
                                </NavLink>
                            </li>))}
                        {appLoading ? (<li className="nav-item"><NavLink><span
                            className="spinner-border spinner-border-sm margin-right" role="status"
                            aria-hidden="true"></span></NavLink></li>) : null}
                        {account && account.access && account.access.manageAccess
                            ? (<li className="nav-item">
                                <NavLink tag={Link} onClick={navigate} className={getClassName('/admin')} to={`/admin`}>
                                    Admin
                                </NavLink>
                            </li>)
                            : null}
                        <li className="nav-item">
                            {!appLoading && account ?
                                <a className="nav-link text-light" href={`${getAccountUrl('Logout')}`}>Logout
                                    ({account.name})</a> : null}
                            {!appLoading && !account ?
                                <a className="nav-link text-light" href={`${getAccountUrl('Login')}`}>Login</a> : null}
                        </li>
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
