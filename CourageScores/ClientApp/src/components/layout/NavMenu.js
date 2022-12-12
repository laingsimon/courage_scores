import React, {useEffect, useState} from 'react';
import {Collapse, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink} from 'reactstrap';
import {Link, useLocation} from 'react-router-dom';
import './NavMenu.css';
import {Settings} from "../../api/settings";

export function NavMenu({divisions, appLoading, account}) {
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
    }

    function getAccountUrl(action) {
        return `${settings.apiHost}/api/Account/${action}/?redirectUrl=${currentLink}`;
    }

    return (<header>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" container dark>
                <NavbarBrand onClick={() => setCollapsed(!collapsed)}  className="me-auto">Menu</NavbarBrand>
                <NavbarToggler onClick={() => setCollapsed(!collapsed)} className="mr-2"/>
                <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                    <ul className="navbar-nav flex-grow">
                        <NavItem>
                            <NavLink tag={Link} onClick={navigate} className={getClassName(document.location.origin + '/?$')} to="/">Home</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={Link} onClick={navigate} className={getClassName('/news')} to="/news">News</NavLink>
                        </NavItem>
                        {divisions.map(division => (<NavItem key={division.id}>
                          <NavLink tag={Link} onClick={navigate} className={getClassName(`/division/${division.id}`)} to={`/division/${division.id}`}>
                            {division.name}
                          </NavLink>
                        </NavItem>))}
                        <NavItem>
                            {!appLoading && account ? <a className="nav-link text-light" href={`${getAccountUrl('Logout')}`}>Logout ({account.name})</a> : null}
                            {!appLoading && !account ? <a className="nav-link text-light" href={`${getAccountUrl('Login')}`}>Login</a> : null}
                        </NavItem>
                        {account && account.access && account.access.manageAccess
                            ? (<NavItem>
                                <NavLink tag={Link} onClick={navigate} className={getClassName('/userAdmin')} to={`/userAdmin`}>
                                    User admin
                                </NavLink>
                            </NavItem>)
                            : null}
                        {account && account.access && account.access.exportData
                            ? (<NavItem>
                                <NavLink tag={Link} onClick={navigate} className={getClassName('/dataAdmin/export')} to={`/dataAdmin/export`}>
                                    Export data
                                </NavLink>
                            </NavItem>)
                            : null}
                    </ul>
                </Collapse>
            </Navbar>
        </header>);
}
