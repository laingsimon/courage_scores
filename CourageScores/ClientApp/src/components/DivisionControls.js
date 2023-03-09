import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {Link, useParams} from "react-router-dom";
import React, {useState} from "react";
import {ErrorDisplay} from "./common/ErrorDisplay";
import {Dialog} from "./common/Dialog";
import {EditDivision} from "./EditDivision";
import {EditSeason} from "./EditSeason";
import {any, isEmpty, sortBy} from "../Utilities";

export function DivisionControls({ account, originalSeasonData, seasons, originalDivisionData, onReloadDivisionData, onReloadSeasonData, reloadAll, divisions, overrideMode }) {
    const { mode } = useParams();
    // noinspection JSUnresolvedVariable
    const isDivisionAdmin = account && account.access && account.access.manageDivisions;
    // noinspection JSUnresolvedVariable
    const isSeasonAdmin = account && account.access && account.access.manageSeasons;
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
                divisions={divisions}
                seasons={seasons} />
        </Dialog>);
    }

    function shouldShowDivision(division) {
        return (isSeasonAdmin && isDivisionAdmin) || isDivisionSelected(division);
    }

    function isDivisionSelected(division) {
        if (!originalSeasonData || !originalSeasonData.divisions) {
            return false;
        }

        return isEmpty(originalSeasonData.divisions)
            || any(originalSeasonData.divisions, d => d.id === division.id);
    }

    function toEditableSeason(seasonData) {
        const data = Object.assign({}, seasonData);
        data.divisionIds = (seasonData.divisions || []).map(d => d.id);
        return data;
    }

    function firstValidDivisionIdForSeason(season) {
        if (originalDivisionData && (isEmpty(season.divisions) || any(season.divisions, d => d.id === originalDivisionData.id))) {
            return originalDivisionData.id;
        }

        return season.divisions[0].id;
    }

    return (<div className="btn-group py-2 d-print-none">
        {divisionData ? renderEditDivisionDialog() : null}
        {seasonData ? renderEditSeasonDialog() : null}
        <ButtonDropdown isOpen={openDropdown === 'season' || !originalSeasonData} toggle={() => { if (any(seasons)) { toggleDropdown('season') } }}>
            <button className={`btn ${isSeasonAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={isSeasonAdmin ? () => setSeasonData(toEditableSeason(originalSeasonData)) : null}>
                    {originalSeasonData
                        ? (<span>{originalSeasonData.name} ({renderDate(originalSeasonData.startDate)} - {renderDate(originalSeasonData.endDate)})</span>)
                        : (<span>Select a season</span>)}
                {isSeasonAdmin ? '✏' : ''}
            </button>
            {any(seasons) ? (<DropdownToggle caret color={isSeasonAdmin ? 'info' : 'light'}></DropdownToggle>) : null}
            {any(seasons) ? (<DropdownMenu>
                {seasons.sort(sortBy('startDate', true)).map(s => (<Link key={s.id} className={`dropdown-item ${originalSeasonData && originalSeasonData.id === s.id ? ' active' : ''}`} to={`/division/${firstValidDivisionIdForSeason(s)}/${overrideMode || mode || 'teams'}/${s.id}`}>
                    {s.name} ({renderDate(s.startDate)} - {renderDate(s.endDate)})
                </Link>))}
                {isSeasonAdmin ? (<DropdownItem>
                    <span onClick={() => setSeasonData({})} className="btn">➕ New season</span>
                </DropdownItem>) : null}
            </DropdownMenu>) : null}
        </ButtonDropdown>
        {originalDivisionData && divisions && originalSeasonData ? (
            <ButtonDropdown isOpen={openDropdown === 'division'} toggle={() => { if (any(divisions, shouldShowDivision)) { toggleDropdown('division') } } }>
                <button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={isDivisionAdmin ? () => setDivisionData(Object.assign({}, originalDivisionData)) : null}>
                    {originalDivisionData.name}
                    {isDivisionAdmin ? '✏' : ''}
                </button>
                {divisions.filter(shouldShowDivision).length > 1 || isDivisionAdmin ? (<DropdownToggle caret color={isDivisionAdmin ? 'info' : 'light'}></DropdownToggle>) : null}
                {divisions.filter(shouldShowDivision).length > 1 || isDivisionAdmin ? (<DropdownMenu>
                    {divisions.filter(shouldShowDivision).sort(sortBy('name')).map(d => (<Link key={d.id} className={`dropdown-item ${originalDivisionData.id === d.id ? ' active' : ''}${isDivisionSelected(d) ? '' : ' text-warning'}`} to={`/division/${d.id}/${overrideMode || stripIdFromMode(mode) || 'teams'}/${originalSeasonData.id}`}>{d.name}</Link>))}
                    {isDivisionAdmin ? (<DropdownItem>
                        <span className="btn" onClick={() => setDivisionData({})}>➕ New division</span>
                    </DropdownItem>) : null}
                </DropdownMenu>) : null}
            </ButtonDropdown>) : null}
        {(!originalDivisionData || !divisions || !originalSeasonData) ? (<div className="btn-group"><button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}>All divisions</button></div>) : null}
        {saveError
            ? (<ErrorDisplay
                {...saveError}
                onClose={() => setSaveError(null)}
                title="Could not save details" />)
            : null}
    </div>);
}
