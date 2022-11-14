import React, { useEffect, useState } from 'react';
import {Link, useParams} from "react-router-dom";
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle, NavItem, NavLink} from "reactstrap";
import {DivisionTeams} from "./DivisionTeams";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionPlayers} from "./DivisionPlayers";
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {DivisionApi} from "../api/division";
import {SeasonApi} from "../api/season";

export function Division({ account, apis }) {
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
    const [ seasonsDropdownOpen, setSeasonsDropdownOpen ] = useState(false);

    async function reloadDivisionData() {
        const api = new DivisionApi(new Http(new Settings()));
        const divisionData = await api.data(divisionId);
        setDivisionData(divisionData);
    }

    useEffect(() => {
        if (loading) {
            return;
        }

        if (divisionData && divisionData.id === divisionId) {
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

    if (loading || !divisionData) {
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
        if (updatingData) {
            return;
        }

        try {
            setUpdatingData(true);
            const api = new SeasonApi(new Http(new Settings()));
            const result = await api.update(seasonData);

            if (result.success) {
                await apis.reloadAll();
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
        if (updatingData) {
            return;
        }

        try {
            setUpdatingData(true);
            const api = new DivisionApi(new Http(new Settings()));
            const result = await api.update({
                id: divisionId,
                name: divisionName
            });

            if (result.success) {
                await apis.reloadAll();
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

    function renderDate(dateStr) {
        return new Date(dateStr).toDateString().substring(4);
    }

    return (<div>
        <div className="btn-group py-2">
            {editMode !== 'division' ? (<button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={() => isDivisionAdmin ? setEditMode('division') : null}>
                {divisionName}
                {isDivisionAdmin ? '✏' : ''}
            </button>) : null}
            {editMode === 'division'
                ? (<div className="input-group margin-right">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Name</span>
                    </div>
                    <input readOnly={updatingData} value={divisionName} onChange={updateDivisionName} className="no-border margin-right" />
                    <button className="btn btn-sm btn-primary" onClick={saveDivisionName}>
                        {updatingData ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                        Save
                    </button>
                    {updatingData ? null : (<button className="btn btn-sm btn-warning" onClick={() => setEditMode(null)}>Cancel</button>)}
                </div>)
                : null}
            {editMode !== 'season' ? (<ButtonDropdown isOpen={seasonsDropdownOpen} toggle={() => setSeasonsDropdownOpen(!seasonsDropdownOpen)}>
                    <button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={() => isSeasonAdmin ? setEditMode('season') : null}>
                        {seasonData.name} ({renderDate(divisionData.season.startDate)} - {renderDate(divisionData.season.endDate)})
                        {isSeasonAdmin ? '✏' : ''}
                    </button>
                    <DropdownToggle caret color="info">
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem>{seasonData.name} ({renderDate(divisionData.season.startDate)} - {renderDate(divisionData.season.endDate)})</DropdownItem>
                    </DropdownMenu>
                </ButtonDropdown>
            ) : null}
            {editMode === 'season'
                ? (<div className="input-group margin-left">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Name</span>
                    </div>
                    <input readOnly={updatingData} onChange={updateSeasonData} name="name" value={seasonData.name} className="no-border margin-right"/>
                    <div className="input-group-prepend">
                        <span className="input-group-text">From</span>
                    </div>
                    <input readOnly={updatingData} onChange={updateSeasonData} name="startDate" value={seasonData.startDate} type="date" className="no-border margin-right"/>
                    <div className="input-group-prepend">
                        <span className="input-group-text">To</span>
                    </div>
                    <input readOnly={updatingData} onChange={updateSeasonData} name="endDate" value={seasonData.endDate} type="date" className="no-border margin-right"/>
                    <button className="btn btn-sm btn-primary" onClick={saveSeasonDetails}>
                        {updatingData ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                        Save
                    </button>
                    {updatingData ? null : (<button className="btn btn-sm btn-warning" onClick={() => setEditMode(null)}>Cancel</button>)}
                </div>)
                : null}
        </div>
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
