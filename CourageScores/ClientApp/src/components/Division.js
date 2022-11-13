import React, { useEffect, useState } from 'react';
import {Link, useParams} from "react-router-dom";
import {NavItem, NavLink} from "reactstrap";
import {DivisionTeams} from "./DivisionTeams";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionPlayers} from "./DivisionPlayers";
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {DivisionApi} from "../api/division";

export function Division({ account }) {
    const { divisionId, mode } = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const effectiveTab = mode || 'teams';
    const isAdmin = account && account.access && account.access.leagueAdmin;
    const [ editMode, setEditMode ] = useState(null);

    async function reloadDivisionData() {
        const api = new DivisionApi(new Http(new Settings()));
        const divisionData = await api.data(divisionId);
        setDivisionData(divisionData);
    }

    useEffect(() => {
        if (divisionData || loading) {
            return;
        }

        setLoading(true);

        async function reloadDivisionData() {
            const api = new DivisionApi(new Http(new Settings()));
            setDivisionData(await api.data(divisionId));
            setLoading(false);
        }

        reloadDivisionData();
    }, [ divisionData, loading, divisionId ]);

    if (!divisionData) {
        return (<div className="light-background p-3">
            <span className="h1">🎯</span> Loading...
        </div>);
    }

    return (<div>
        <h2>
            {editMode === 'division'
                ? (<span>
                    <input value={divisionData.name} />
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>Cancel</button></span>)
                : (<span>{divisionData.name} {isAdmin ? (<span className="extra-small" onClick={() => setEditMode('division')}>✏️</span>) : null}
                </span>)},
            {editMode === 'season'
                ? (<span>
                    <input value={divisionData.seasonName}/>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>Cancel</button></span>)
                : (<span>{divisionData.seasonName} {isAdmin ? (<span className="extra-small" onClick={() => setEditMode('season')}>✏️</span>) : null}
                </span>)}
        </h2>
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
        {effectiveTab === 'teams' ? <DivisionTeams divisionData={divisionData} onReloadDivision={reloadDivisionData} account={account} divisionId={divisionId} /> : null}
        {effectiveTab === 'fixtures' ? <DivisionFixtures divisionData={divisionData} account={account} onReloadDivision={reloadDivisionData} /> : null}
        {effectiveTab === 'players' ? <DivisionPlayers divisionData={divisionData} account={account} onReloadDivision={reloadDivisionData} /> : null}
    </div>);
}
