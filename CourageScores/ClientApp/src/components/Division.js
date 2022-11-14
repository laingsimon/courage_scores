import React, { useEffect, useState } from 'react';
import {Link, useParams} from "react-router-dom";
import {NavItem, NavLink} from "reactstrap";
import {DivisionTeams} from "./DivisionTeams";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionPlayers} from "./DivisionPlayers";
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {DivisionApi} from "../api/division";
import {SeasonApi} from "../api/season";

export function Division({ account }) {
    const { divisionId, mode } = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const effectiveTab = mode || 'teams';
    const isDivisionAdmin = account && account.access && account.access.manageDivisions;
    const isSeasonAdmin = account && account.access && account.access.manageSeasons;
    const [ editMode, setEditMode ] = useState(null);
    const [ seasonData, setSeasonData ] = useState(null);
    const [ divisionName, setDivisionName ] = useState(null);
    const [ updatingData, setUpdatingData ] = useState(false);

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
            const divisionData = await api.data(divisionId);
            setDivisionData(divisionData);
            setSeasonData({
                id: divisionData.season.id,
                name: divisionData.season.name,
                startDate: divisionData.season.startDate.substring(0, 10),
                endDate: divisionData.season.endDate.substring(0, 10),
            });
            setDivisionName(divisionData.name);
            setLoading(false);
        }

        reloadDivisionData();
    }, [ divisionData, loading, divisionId ]);

    if (!divisionData) {
        return (<div className="light-background p-3">
            <span className="h1">🎯</span> Loading...
        </div>);
    }

    function updateSeasonData(event) {
        const currentData = Object.assign({}, seasonData);
        currentData[event.target.name] = event.target.value;
        setSeasonData(currentData);
    }

    function updateDivisionName(event) {
        setDivisionName(event.target.value);
    }

    async function saveSeasonDetails() {
        try {
            setUpdatingData(true);
            const api = new SeasonApi(new Http(new Settings()));
            const result = await api.update(seasonData);

            if (result.success) {
                await reloadDivisionData();
                setEditMode(null);
            } else {
                console.log(result);
                window.alert(`Could not update season data`);
            }
        } finally {
            setUpdatingData(false);
        }
    }

    async function saveDivisionName() {
        try {
            setUpdatingData(true);
            const api = new DivisionApi(new Http(new Settings()));
            const result = await api.update({
                id: divisionId,
                name: divisionName
            });

            if (result.success) {
                await reloadDivisionData();
                setEditMode(null);
            } else {
                console.log(result);
                window.alert(`Could not update division name`);
            }
        } finally {
            setUpdatingData(false);
        }
    }

    return (<div>
        <h2>
            {editMode === 'division'
                ? (<span className="h4">
                    <input disabled={updatingData} value={divisionName} onChange={updateDivisionName} className="margin-right" />
                    <button className="btn btn-sm btn-primary margin-right" onClick={saveDivisionName}>Save</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>Cancel</button>
                </span>)
                : (<span>{divisionData.name} {isDivisionAdmin ? (<span className="btn btn-sm extra-small" onClick={() => setEditMode('division')}>✏️</span>) : null}
                </span>)},
            {editMode === 'season'
                ? (<span className="h4">
                    <input disabled={updatingData} onChange={updateSeasonData} name="name" value={seasonData.name}/>
                    <input disabled={updatingData} onChange={updateSeasonData} name="startDate" value={seasonData.startDate} type="date"/>
                    -
                    <input disabled={updatingData} onChange={updateSeasonData} name="endDate" value={seasonData.endDate} type="date"/>
                    <button className="btn btn-sm btn-primary margin-right" onClick={saveSeasonDetails}>Save</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(null)}>Cancel</button>
                </span>)
                : (<span>{divisionData.season.name} ({new Date(divisionData.season.startDate).toDateString()} - {new Date(divisionData.season.endDate).toDateString()}) {isSeasonAdmin
                    ? (<span className="btn btn-sm extra-small" onClick={() => setEditMode('season')}>✏️</span>)
                    : null}
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
