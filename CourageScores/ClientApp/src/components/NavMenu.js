import React, { useState } from 'react';
import {Collapse, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink} from 'reactstrap';
import {Link} from 'react-router-dom';
import './NavMenu.css';
import {Settings} from "../api/settings";

export function NavMenu(props) {
    const settings = new Settings();
    const [collapsed, setCollapsed] = useState(true);

    return (<header>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" container light>
                <NavbarBrand tag={Link} to="/">The Courage League</NavbarBrand>
                <NavbarToggler onClick={() => setCollapsed(!collapsed)} className="mr-2"/>
                <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                    <ul className="navbar-nav flex-grow">
                        <NavItem>
                            <NavLink tag={Link} className="text-dark" to="/">Home</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={Link} className="text-dark" to="/news">News</NavLink>
                        </NavItem>
                        {props.divisions.map(division => (<NavItem key={division.id}>
                          <NavLink tag={Link} className="text-dark" to={`/division/${division.id}`}>
                            {division.name}
                          </NavLink>
                        </NavItem>))}
                        <NavItem>
                            {!props.appLoading && props.account ? <a className="nav-link text-dark" href={`${settings.apiHost}/api/Account/Logout`}>Logout ({props.account.name})</a> : null}
                            {!props.appLoading && !props.account ? <a className="nav-link text-dark" href={`${settings.apiHost}/api/Account/Login`}>Login</a> : null}
                        </NavItem>
                    </ul>
                </Collapse>
            </Navbar>
        </header>);
}
