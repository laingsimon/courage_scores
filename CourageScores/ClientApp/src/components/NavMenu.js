import React, { Component } from 'react';
import { Collapse, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import './NavMenu.css';
import {Settings} from "../api/settings";
import {Division} from "../api/division";
import {Http} from "../api/http";

export class NavMenu extends Component {
  static displayName = NavMenu.name;

  constructor (props) {
    super(props);

    this.settings = new Settings();
    this.divisionApi = new Division(new Http(this.settings));
    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.state = {
      collapsed: true,
      divisions: []
    };
  }

  async componentDidMount() {
    this.setState({
      divisions: await this.divisionApi.getAll()
    });
  }

  toggleNavbar () {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  render() {
    return (
      <header>
        <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" container light>
          <NavbarBrand tag={Link} to="/">CourageScores</NavbarBrand>
          <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
          <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed} navbar>
            <ul className="navbar-nav flex-grow">
              <NavItem>
                <NavLink tag={Link} className="text-dark" to="/">Home</NavLink>
              </NavItem>
              {this.state.divisions.map(division => (<NavItem><NavLink tag={Link} className="text-dark" to={`/division/${division.id}`}>{division.name}</NavLink></NavItem>))}
            </ul>
          </Collapse>
        </Navbar>
      </header>
    );
  }
}
