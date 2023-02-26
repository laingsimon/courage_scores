import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {Link, useParams} from "react-router-dom";
import React, {useState} from "react";
import {SeasonApi} from "../api/season";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import {DivisionApi} from "../api/division";
import {ErrorDisplay} from "./common/ErrorDisplay";
import {Dialog} from "./common/Dialog";
import {propChanged, valueChanged} from "../Utilities";
import {EditDivision} from "./EditDivision";

export function DivisionControls({ account, originalSeasonData, seasons, originalDivisionData, onReloadDivisionData, reloadAll, divisions, overrideMode }) {
    const { mode } = useParams();
    const isDivisionAdmin = account && account.access && account.access.manageDivisions;
    const isSeasonAdmin = account && account.access && account.access.manageSeasons;
    const [ editMode, setEditMode ] = useState(null);
    const [ updatingData, setUpdatingData ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const [ seasonData, setSeasonData ] = useState(originalSeasonData);
    const [ openDropdown, setOpenDropdown ] = useState(null);
    const [ divisionData, setDivisionData ] = useState(null);

    function toggleDropdown(name) {
        if (openDropdown === null || openDropdown !== name) {
            setOpenDropdown(name);
        } else {
            setOpenDropdown(null);
        }
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
                document.location.href = `https://${document.location.host}`;
            } else {
                setSaveError(result);
            }
        } finally {
            setUpdatingData(false);
        }
    }

    async function deleteDivision(divisionData) {
        if (updatingData) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the ${divisionData.name} division?`)) {
            return;
        }

        try {
            setUpdatingData(true);
            const api = new DivisionApi(new Http(new Settings()));
            const result = await api.delete(originalDivisionData.id);

            if (result.success) {
                document.location.href = `https://${document.location.host}`;
            } else {
                setSaveError(result);
            }
        } finally {
            setUpdatingData(false);
        }
    }

    function renderDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-GB', { month: "short", day: "numeric" });
    }

    function stripIdFromMode(mode) {
        if (!mode) {
            return mode;
        }

        const index = mode.indexOf(':');
        return index === -1
            ? mode
            : mode.substring(0, index) + 's';
    }

    function renderEditDivisionDialog() {
        return (<Dialog title={divisionData.id ? 'Edit a division' : 'Create a division'} slim={true}>
            <EditDivision
                divisionId={divisionData.id}
                name={divisionData.name}
                onClose={() => setDivisionData(null)}
                onChange={propChanged(divisionData, setDivisionData)}
                reloadAll={async () => {
                    await reloadAll();
                    if (onReloadDivisionData) {
                        await onReloadDivisionData();
                    }
                    setDivisionData(null);
                }}
                setSaveError={setSaveError}/>
        </Dialog>);
    }

    return (<div className="btn-group py-2 d-print-none">
        {divisionData ? renderEditDivisionDialog() : null}
        {originalDivisionData && divisions ? (
                <ButtonDropdown isOpen={openDropdown === 'division'} toggle={() => toggleDropdown('division')}>
                    <button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={() => isDivisionAdmin ? setDivisionData(Object.assign({}, originalDivisionData)) : null}>
                        {originalDivisionData.name}
                        {isDivisionAdmin ? '✏' : ''}
                    </button>
                    <button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={() => deleteDivision(originalDivisionData)}>
                        {isDivisionAdmin ? '🗑' : ''}
                    </button>
                    <DropdownToggle caret color={isDivisionAdmin ? 'info' : 'light'}>
                    </DropdownToggle>
                    <DropdownMenu>
                        {divisions.map(d => (<DropdownItem key={d.id}>
                                <Link className="btn" to={`/division/${d.id}/${overrideMode || stripIdFromMode(mode) || 'teams'}/${originalSeasonData.id}`}>{d.name}</Link>
                            </DropdownItem>
                        ))}
                        {isDivisionAdmin ? (<DropdownItem>
                            <span className="btn" onClick={() => setDivisionData({})}>➕ New division</span>
                        </DropdownItem>) : null}
                    </DropdownMenu>
                </ButtonDropdown>) : null}
        {(!originalDivisionData || !divisions) ? (<div className="btn-group"><button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}>All divisions</button></div>) : null}
        {editMode !== 'season' ? (<ButtonDropdown isOpen={openDropdown === 'season'} toggle={() => { if (originalDivisionData) { toggleDropdown('season') } }}>
                <button className={`btn ${isSeasonAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={() => isSeasonAdmin ? setEditMode('season') : null}>
                    {seasonData.name} ({renderDate(seasonData.startDate)} - {renderDate(seasonData.endDate)})
                    {isSeasonAdmin ? '✏' : ''}
                </button>
                {originalDivisionData ? (<DropdownToggle caret color={isSeasonAdmin ? 'info' : 'light'}></DropdownToggle>) : null}
                {originalDivisionData ? (<DropdownMenu>
                    {seasons.map(s => (<DropdownItem key={s.id}>
                            <Link className="btn" to={`/division/${originalDivisionData.id}/${overrideMode || mode || 'teams'}/${s.id}`}>{s.name} ({renderDate(s.startDate)} - {renderDate(s.endDate)})</Link>
                        </DropdownItem>
                    ))}
                    {isSeasonAdmin ? (<DropdownItem>
                        <Link to={`/season/new`} className="btn">➕ New season</Link>
                    </DropdownItem>) : null}
                </DropdownMenu>) : null}
            </ButtonDropdown>
        ) : null}
        {editMode === 'season'
            ? (<div className="input-group margin-left">
                <div className="input-group-prepend">
                    <span className="input-group-text">Name</span>
                </div>
                <input readOnly={updatingData} onChange={valueChanged(seasonData, setSeasonData)} name="name" value={seasonData.name} className="border-0 margin-right"/>
                <div className="input-group-prepend">
                    <span className="input-group-text">From</span>
                </div>
                <input readOnly={updatingData} onChange={valueChanged(seasonData, setSeasonData)} name="startDate" value={seasonData.startDate} type="date" className="border-0 margin-right"/>
                <div className="input-group-prepend">
                    <span className="input-group-text">To</span>
                </div>
                <input readOnly={updatingData} onChange={valueChanged(seasonData, setSeasonData)} name="endDate" value={seasonData.endDate} type="date" className="border-0 margin-right"/>
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
