import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {Link, useParams} from "react-router-dom";
import React, {useState} from "react";
import {SeasonApi} from "../api/season";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import {DivisionApi} from "../api/division";
import {ErrorDisplay} from "./common/ErrorDisplay";

export function DivisionControls({ account, originalSeasonData, seasons, originalDivisionData, onReloadDivisionData, reloadAll }) {
    const { mode } = useParams();
    const isDivisionAdmin = account && account.access && account.access.manageDivisions;
    const isSeasonAdmin = account && account.access && account.access.manageSeasons;
    const [ editMode, setEditMode ] = useState(null);
    const [ updatingData, setUpdatingData ] = useState(false);
    const [ seasonsDropdownOpen, setSeasonsDropdownOpen ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const [ seasonData, setSeasonData ] = useState(originalSeasonData);
    const [ divisionName, setDivisionName ] = useState(originalDivisionData.name);

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
                await reloadAll();
                if (onReloadDivisionData) {
                    await onReloadDivisionData();
                }
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
                await reloadAll();
                if (onReloadDivisionData) {
                    await onReloadDivisionData();
                }
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
                id: originalDivisionData.id,
                name: divisionName
            });

            if (result.success) {
                await reloadAll();
                if (onReloadDivisionData) {
                    await onReloadDivisionData();
                }
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

    return (<div className="btn-group py-2">
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
                    {seasonData.name} ({renderDate(seasonData.startDate)} - {renderDate(seasonData.endDate)})
                    {isSeasonAdmin ? '✏' : ''}
                </button>
                <DropdownToggle caret color={isDivisionAdmin ? 'info' : 'light'}>
                </DropdownToggle>
                <DropdownMenu>
                    {seasons.map(s => (<DropdownItem key={s.id}>
                            <Link className="btn" to={`/division/${originalDivisionData.id}/${mode || 'teams'}/${s.id}`}>{s.name} ({renderDate(s.startDate)} - {renderDate(s.endDate)})</Link>
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
        {saveError
            ? (<ErrorDisplay
                {...saveError}
                onClose={() => setSaveError(null)}
                title="Could not save details" />)
            : null}
    </div>);
}