import React from 'react';
import {Link, useParams} from "react-router-dom";
import {NavItem, NavLink} from "reactstrap";
import {DivisionTeams} from "./DivisionTeams";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionPlayers} from "./DivisionPlayers";

export function Division(props) {
    const {divisionId, mode} = useParams();
    const division = props.divisions[divisionId];
    const effectiveTab = mode || 'teams'

    if (!division) {
        return (<div>Loading...</div>);
    }

    return (<div>
        <h2>{division.name}</h2>
        <ul className="nav nav-tabs">
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'teams' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/teams`}>Teams</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'fixtures' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/fixtures`}>Fixtures</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'players' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/players`}>Players</NavLink>
            </NavItem>
        </ul>
        {effectiveTab === 'teams' ? <DivisionTeams {...props} /> : null}
        {effectiveTab === 'fixtures' ? <DivisionFixtures {...props} /> : null}
        {effectiveTab === 'players' ? <DivisionPlayers {...props} /> : null}
    </div>);
}
