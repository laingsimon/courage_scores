import React, {useEffect, useState} from 'react';
import {Collapse, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink} from 'reactstrap';
import {Link, useLocation} from 'react-router-dom';
import './NavMenu.css';
import {Settings} from "../../api/settings";

export function NavMenu({divisions, appLoading, account, clearError}) {
    const settings = new Settings();
    const [collapsed, setCollapsed] = useState(true);
    const [ currentLink, setCurrentLink ] = useState(document.location.href);
    const location = useLocation();

    useEffect(() => {
        setCurrentLink('https://' + document.location.host + location.pathname);
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

    return (<header className="d-print-none">
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" container dark>
                <NavbarBrand onClick={() => setCollapsed(!collapsed)}  className="me-auto">Menu</NavbarBrand>
                <NavbarToggler onClick={() => setCollapsed(!collapsed)} className="mr-2"/>
                <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                    <ul className="navbar-nav flex-grow">
                        <NavItem>
                            <NavLink className="nav-link text-light" href="http://thecourageleague.co.uk/">Home</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className="nav-link text-light" href="http://thecourageleague.co.uk/?cat=13">News</NavLink>
                        </NavItem>
                        {divisions.map(division => (<NavItem key={division.id}>
                          <NavLink tag={Link} onClick={navigate} className={getClassName(`/division/${division.id}`)} to={`/division/${division.id}`}>
                            {division.name}
                          </NavLink>
                        </NavItem>))}
                        {appLoading ? (<NavItem><NavLink><span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span></NavLink></NavItem>) : null}
                        {account && account.access && account.access.manageAccess
                            ? (<NavItem>
                                <NavLink tag={Link} onClick={navigate} className={getClassName('/admin')} to={`/admin`}>
                                    Admin
                                </NavLink>
                            </NavItem>)
                            : null}
                        <NavItem>
                            {!appLoading && account ? <a className="nav-link text-light" href={`${getAccountUrl('Logout')}`}>Logout ({account.name})</a> : null}
                            {!appLoading && !account ? <a className="nav-link text-light" href={`${getAccountUrl('Login')}`}>Login</a> : null}
                        </NavItem>
                    </ul>
                </Collapse>
            </Navbar>
        </header>);
}
