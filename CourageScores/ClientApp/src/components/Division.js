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
import {Dialog} from "./common/Dialog";

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
    const [ proposingGames, setProposingGames ] = useState(false);
    const [ proposalSettings, setProposalSettings ] = useState(null);
    const [ proposalResponse, setProposalResponse ] = useState(null);
    const [ proposalSettingsDialogVisible, setProposalSettingsDialogVisible ] = useState(false);
    const divisionApi = new DivisionApi(new Http(new Settings()));
    const teamApi = new TeamApi(new Http(new Settings()));
    const seasonApi = new SeasonApi(new Http(new Settings()));

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
            setProposalSettings({
                divisionId: divisionId,
                seasonId: seasonId || divisionData.season.id,
                teams: [ ],
                weekDay: 'Thursday',
                excludedDates: { },
                // frequencyDays: 7, not required as weekDay is provided
                numberOfLegs: 2,
                // startDate: "2022-01-01" // not required, use season start date
                logLevel: 'Warning'
            });
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

    async function proposeFixtures() {
        setUpdatingData(true);
        setProposingGames(true);
        setProposalResponse(null);
        try {
            const response = await seasonApi.propose(proposalSettings);
            if (response.success) {
                const newDivisionData = Object.assign({}, divisionData);
                newDivisionData.fixtures = response.result;
                setDivisionData(newDivisionData);

                setProposalResponse(response);
                if (!proposalResponse.messages.length && !proposalResponse.warnings.length && !proposalResponse.errors.length) {
                    setProposalSettingsDialogVisible(false);
                }
            } else {
                setSaveError(response);
            }
        } finally {
            setProposingGames(false);
            setUpdatingData(false);
        }
    }

    function beginProposeFixtures() {
        setProposalResponse(null);
        setProposalSettingsDialogVisible(true);
    }

    function updateProposalSettings(event) {
        const newProposalSettings = Object.assign({}, proposalSettings);
        newProposalSettings[event.target.name] = event.target.value;
        setProposalSettings(newProposalSettings);
    }

    function renderProposalSettings() {
        let index = 0;

        function renderValidationErrors(errors) {
            return (<ol className="text-danger">
                {Object.keys(errors).map(key => {
                    return (<li key={key}>{key} {errors[key].map(e => (<p key={index++}>{e}</p>))}</li>)
                })}
            </ol>)
        }

        return (<div className="text-black"><Dialog title="Propose games...">
            <div>
                <div className="input-group my-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Number of legs</span>
                    </div>
                    <select disabled={proposingGames} value={proposalSettings.numberOfLegs} onChange={updateProposalSettings} name="numberOfLegs">
                        <option value="1">Single leg</option>
                        <option value="2">Two legs</option>
                    </select>
                </div>
                <div className="input-group my-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Log level</span>
                    </div>
                    <select name="logLevel" value={proposalSettings.logLevel} onChange={updateProposalSettings}>
                        <option value="Information">Everything</option>
                        <option value="Warning">Warnings and Errors</option>
                        <option value="Error">Errors only</option>
                    </select>
                </div>
            </div>
            {proposalResponse ? (<ul>
                {proposalResponse.errors && proposalResponse.errors.length ? proposalResponse.errors.map(e => (<li key={index++} className="text-danger">{e}</li>)) : null}
                {proposalResponse.errors && !proposalResponse.errors.length ? (renderValidationErrors(proposalResponse.errors)): null}
                {proposalResponse.warnings ? proposalResponse.warnings.map(w => (<li key={index++} className="text-warning">{w}</li>)) : null}
                {proposalResponse.messages ? proposalResponse.messages.map(m => (<li key={index++} className="text-primary">{m}</li>)) : null}
            </ul>) : null}
            <div className="text-end">
                {proposalResponse ? (<span className="margin-right text-primary fw-bold">✔ Click close to see the proposed fixtures</span>) : null}
                <button className="btn btn-success margin-right" onClick={proposeFixtures}>
                    {proposingGames ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                    Propose Games...
                </button>
                <button className="btn btn-primary margin-right" onClick={() => setProposalSettingsDialogVisible(false)}>Close</button>
            </div>
        </Dialog></div>)
    }

    return (<div>
        {proposalSettingsDialogVisible ? renderProposalSettings() : null}
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
                onReloadDivision={reloadDivisionData}
                onProposeFixtures={beginProposeFixtures}
                proposingGames={proposingGames} />)
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
