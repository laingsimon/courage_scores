import React, { useState } from 'react';
import {Collapse, Navbar, NavbarToggler, NavItem, NavLink} from 'reactstrap';
import {Link} from 'react-router-dom';
import './NavMenu.css';
import {Settings} from "../api/settings";

export function NavMenu({divisions, appLoading, account}) {
    const settings = new Settings();
    const [collapsed, setCollapsed] = useState(true);

    return (<header>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" container light>
                <NavbarToggler onClick={() => setCollapsed(!collapsed)} className="mr-2"/>
                <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                    <ul className="navbar-nav flex-grow">
                        <NavItem>
                            <NavLink tag={Link} className="text-light" to="/">Home</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={Link} className="text-light" to="/news">News</NavLink>
                        </NavItem>
                        {divisions.map(division => (<NavItem key={division.id}>
                          <NavLink tag={Link} className="text-light" to={`/division/${division.id}`}>
                            {division.name}
                          </NavLink>
                        </NavItem>))}
                        <NavItem>
                            {!appLoading && account ? <a className="nav-link text-light" href={`${settings.apiHost}/api/Account/Logout/?redirectUrl=${document.location.href}`}>Logout ({account.name})</a> : null}
                            {!appLoading && !account ? <a className="nav-link text-light" href={`${settings.apiHost}/api/Account/Login/?redirectUrl=${document.location.href}`}>Login</a> : null}
                        </NavItem>
                        {account && account.access && account.access.manageAccess ? (<NavLink tag={Link} className="text-light" to={`/userAdmin`}>User admin</NavLink>) : null}
                    </ul>
                </Collapse>
            </Navbar>
        </header>);
}
