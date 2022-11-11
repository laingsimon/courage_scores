import React, { useEffect, useState } from 'react';
import {Link, useParams} from "react-router-dom";
import {NavItem, NavLink} from "reactstrap";
import {DivisionTeams} from "./DivisionTeams";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionPlayers} from "./DivisionPlayers";
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {DivisionApi} from "../api/division";

export function Division(props) {
    const {divisionId, mode} = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const effectiveTab = mode || 'teams'

    async function reloadDivisionData() {
        const api = new DivisionApi(new Http(new Settings()));
        setDivisionData(await api.data(divisionId));
    }

    useEffect(() => {
        if (divisionData) {
            return;
        }

        reloadDivisionData();
    }, [ divisionId, divisionData ]);

    if (!divisionData) {
        return (<div className="light-background p-3">Loading...</div>);
    }

    return (<div>
        <h2>{divisionData.name}, {divisionData.seasonName}</h2>
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
        {effectiveTab === 'teams' ? <DivisionTeams {...props} divisionData={divisionData} divisionId={divisionId} onReloadDivision={reloadDivisionData} /> : null}
        {effectiveTab === 'fixtures' ? <DivisionFixtures {...props} divisionData={divisionData} divisionId={divisionId} onReloadDivision={reloadDivisionData} /> : null}
        {effectiveTab === 'players' ? <DivisionPlayers {...props} divisionData={divisionData} divisionId={divisionId} onReloadDivision={reloadDivisionData} /> : null}
    </div>);
}
