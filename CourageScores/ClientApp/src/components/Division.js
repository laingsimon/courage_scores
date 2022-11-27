import React, { useEffect, useState } from 'react';
import {Link, useParams} from "react-router-dom";
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle, NavItem, NavLink} from "reactstrap";
import {DivisionTeams} from "./division_teams/DivisionTeams";
import {DivisionFixtures} from "./division_fixtures/DivisionFixtures";
import {DivisionPlayers} from "./division_players/DivisionPlayers";
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {DivisionApi} from "../api/division";
import {SeasonApi} from "../api/season";
import {ErrorDisplay} from "./common/ErrorDisplay";
import {TeamApi} from "../api/team";

export function Division({ account, apis }) {
    const { divisionId, mode, seasonId } = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const [ teams, setTeams ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const effectiveTab = mode || 'teams';
    const isDivisionAdmin = account && account.access && account.access.manageDivisions;
    const isSeasonAdmin = account && account.access && account.access.manageSeasons;
    const [ editMode, setEditMode ] = useState(null);
    const [ seasonData, setSeasonData ] = useState(null);
    const [ divisionName, setDivisionName ] = useState('');
    const [ updatingData, setUpdatingData ] = useState(false);
    const [ seasonsDropdownOpen, setSeasonsDropdownOpen ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const divisionApi = new DivisionApi(new Http(new Settings()));
    const teamApi = new TeamApi(new Http(new Settings()));

    async function reloadDivisionData() {
        const divisionData = await divisionApi.data(divisionId, seasonId);
        setDivisionData(divisionData);

        const teams = await teamApi.getForDivisionAndSeason(divisionId, seasonId || divisionData.season.id);
        setTeams(teams);
    }

    useEffect(() => {
        if (loading) {
            return;
        }

        if (divisionData && divisionData.id === divisionId && (divisionData.season.id === seasonId || !seasonId)) {
            return;
        }

        setLoading(true);

        async function reloadDivisionData() {
            const divisionData = await divisionApi.data(divisionId, seasonId);
            const teams = await teamApi.getForDivisionAndSeason(divisionId, seasonId || divisionData.season.id);
            setDivisionData(divisionData);
            setTeams(teams);
            setSeasonData({
                id: divisionData.season.id,
                name: divisionData.season.name,
                startDate: divisionData.season.startDate.substring(0, 10),
                endDate: divisionData.season.endDate.substring(0, 10),
            });
            setDivisionName(divisionData.name);
            setLoading(false);
        }

        // noinspection JSIgnoredPromiseFromCall
        reloadDivisionData();
    },
    // eslint-disable-next-line
    [ divisionData, loading, divisionId, seasonId ]);

    if (loading || !divisionData) {
        return (<div className="light-background p-3 loading-background">
            <div className="mt-2 pt-4 h3">Loading...</div>
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
                setSaveError(result);
            }
        } finally {
            setUpdatingData(false);
        }
    }

    async function deleteSeason() {
        if (updatingData) {
            return;
        }

        if (!window.confirm('Are you sure you want to delete this season?')) {
            return;
        }

        try {
            setUpdatingData(true);
            const api = new SeasonApi(new Http(new Settings()));
            const result = await api.delete(seasonData.id);

            if (result.success) {
                await apis.reloadAll();
                await reloadDivisionData();
                setEditMode(null);
            } else {
                setSaveError(result);
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
                setSaveError(result);
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
                    <DropdownToggle caret color={isDivisionAdmin ? 'info' : 'light'}>
                    </DropdownToggle>
                    <DropdownMenu>
                        {divisionData.seasons.map(s => (<DropdownItem key={s.id}>
                                <Link className="btn" to={`/division/${divisionId}/${mode}/${s.id}`}>{s.name} ({renderDate(s.startDate)} - {renderDate(s.endDate)})</Link>
                            </DropdownItem>
                        ))}
                        {isSeasonAdmin ? (<DropdownItem>
                            <Link to={`/season/new`} className="btn">➕ New season</Link>
                        </DropdownItem>) : null}
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
                    {updatingData ? null : (<button className="btn btn-sm btn-danger" onClick={deleteSeason}>Delete</button>)}
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
        {effectiveTab === 'teams'
            ? (<DivisionTeams
                teams={divisionData.teams}
                teamsWithoutFixtures={divisionData.teamsWithoutFixtures}
                onTeamSaved={reloadDivisionData}
                account={account}
                seasonId={divisionData.season.id}
                divisionId={divisionId} />)
            : null}
        {effectiveTab === 'fixtures'
            ? (<DivisionFixtures
                season={divisionData.season}
                divisionId={divisionData.id}
                fixtures={divisionData.fixtures}
                teams={teams}
                account={account}
                onNewTeam={reloadDivisionData}
                onReloadDivision={reloadDivisionData} />)
            : null}
        {effectiveTab === 'players'
            ? (<DivisionPlayers
                players={divisionData.players}
                account={account}
                onPlayerSaved={reloadDivisionData}
                seasonId={divisionData.season.id} />)
            : null}
        {saveError
            ? (<ErrorDisplay
                {...saveError}
                onClose={() => setSaveError(null)}
                title="Could not save details" />)
            : null}
    </div>);
}
