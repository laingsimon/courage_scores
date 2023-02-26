import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {Link, useParams} from "react-router-dom";
import React, {useState} from "react";
import {SeasonApi} from "../api/season";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import {DivisionApi} from "../api/division";
import {ErrorDisplay} from "./common/ErrorDisplay";
import {Dialog} from "./common/Dialog";
import {EditDivision} from "./EditDivision";
import {EditSeason} from "./EditSeason";

export function DivisionControls({ account, originalSeasonData, seasons, originalDivisionData, onReloadDivisionData, onReloadSeasonData, reloadAll, divisions, overrideMode }) {
    const { mode } = useParams();
    // noinspection JSUnresolvedVariable
    const isDivisionAdmin = account && account.access && account.access.manageDivisions;
    // noinspection JSUnresolvedVariable
    const isSeasonAdmin = account && account.access && account.access.manageSeasons;
    const [ updatingData, setUpdatingData ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const [ seasonData, setSeasonData ] = useState(null);
    const [ openDropdown, setOpenDropdown ] = useState(null);
    const [ divisionData, setDivisionData ] = useState(null);

    function toggleDropdown(name) {
        if (openDropdown === null || openDropdown !== name) {
            setOpenDropdown(name);
        } else {
            setOpenDropdown(null);
        }
    }

    async function deleteSeason(seasonData) {
        if (updatingData) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the ${seasonData.name} season?`)) {
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
                data={divisionData}
                onUpdateData={setDivisionData}
                onClose={() => setDivisionData(null)}
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

    function renderEditSeasonDialog() {
        return (<Dialog title={seasonData.id ? 'Edit a season' : 'Create a season'} slim={true}>
            <EditSeason
                data={seasonData}
                onUpdateData={setSeasonData}
                onClose={() => setSeasonData(null)}
                reloadAll={async () => {
                    await reloadAll();
                    if (onReloadSeasonData) {
                        await onReloadSeasonData();
                    }
                    setSeasonData(null);
                }}
                setSaveError={setSaveError}
                divisions={divisions} />
        </Dialog>);
    }

    function shouldShowDivision(division) {
        if (isSeasonAdmin && isDivisionAdmin) {
            return true;
        }

        return originalSeasonData.divisions.length === 0
            || originalSeasonData.divisions.filter(d => d.id === division.id).length > 0;
    }

    function toEditableSeason(seasonData) {
        const data = Object.assign({}, seasonData);
        data.divisionIds = (seasonData.divisions || []).map(d => d.id);
        return data;
    }

    return (<div className="btn-group py-2 d-print-none">
        {divisionData ? renderEditDivisionDialog() : null}
        {seasonData ? renderEditSeasonDialog() : null}
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
                        {divisions.filter(shouldShowDivision).map(d => (<DropdownItem key={d.id}>
                                <Link className="btn" to={`/division/${d.id}/${overrideMode || stripIdFromMode(mode) || 'teams'}/${originalSeasonData.id}`}>{d.name}</Link>
                            </DropdownItem>
                        ))}
                        {isDivisionAdmin ? (<DropdownItem>
                            <span className="btn" onClick={() => setDivisionData({})}>➕ New division</span>
                        </DropdownItem>) : null}
                    </DropdownMenu>
                </ButtonDropdown>) : null}
        {(!originalDivisionData || !divisions) ? (<div className="btn-group"><button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}>All divisions</button></div>) : null}
        <ButtonDropdown isOpen={openDropdown === 'season'} toggle={() => { if (originalDivisionData) { toggleDropdown('season') } }}>
            <button className={`btn ${isSeasonAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={() => setSeasonData(toEditableSeason(originalSeasonData))}>
                {originalSeasonData.name} ({renderDate(originalSeasonData.startDate)} - {renderDate(originalSeasonData.endDate)})
                {isSeasonAdmin ? '✏' : ''}
            </button>
            <button className={`btn ${isSeasonAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={() => deleteSeason(originalSeasonData)}>
                {isSeasonAdmin ? '🗑' : ''}
            </button>
            {originalSeasonData ? (<DropdownToggle caret color={isSeasonAdmin ? 'info' : 'light'}></DropdownToggle>) : null}
            {originalSeasonData ? (<DropdownMenu>
                {seasons.map(s => (<DropdownItem key={s.id}>
                        <Link className="btn" to={`/division/${originalDivisionData.id}/${overrideMode || mode || 'teams'}/${s.id}`}>{s.name} ({renderDate(s.startDate)} - {renderDate(s.endDate)})</Link>
                    </DropdownItem>
                ))}
                {isSeasonAdmin ? (<DropdownItem>
                    <Link to={`/season/new`} className="btn">➕ New season</Link>
                </DropdownItem>) : null}
            </DropdownMenu>) : null}
        </ButtonDropdown>
        {saveError
            ? (<ErrorDisplay
                {...saveError}
                onClose={() => setSaveError(null)}
                title="Could not save details" />)
            : null}
    </div>);
}
