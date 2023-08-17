import {ButtonDropdown, DropdownMenu, DropdownToggle} from "reactstrap";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import React, {useState} from "react";
import {ErrorDisplay} from "./common/ErrorDisplay";
import {Dialog} from "./common/Dialog";
import {EditDivision} from "./EditDivision";
import {EditSeason} from "./EditSeason";
import {any, isEmpty, sortBy} from "../helpers/collections";
import {renderDate} from "../helpers/rendering";
import {useApp} from "../AppContainer";

export function DivisionControls({originalSeasonData, onDivisionOrSeasonChanged, originalDivisionData, overrideMode}) {
    const {mode} = useParams();
    const {account, divisions, reloadSeasons, reloadDivisions, onError, seasons} = useApp();
    // noinspection JSUnresolvedVariable
    const isDivisionAdmin = account && account.access && account.access.manageDivisions;
    // noinspection JSUnresolvedVariable
    const isSeasonAdmin = account && account.access && account.access.manageSeasons;
    const [saveError, setSaveError] = useState(null);
    const [seasonData, setSeasonData] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [divisionData, setDivisionData] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    function toggleDropdown(name) {
        if (openDropdown === null || openDropdown !== name) {
            setOpenDropdown(name);
        } else {
            setOpenDropdown(null);
        }
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
                onSave={async () => {
                    await reloadDivisions();
                    if (onDivisionOrSeasonChanged) {
                        await onDivisionOrSeasonChanged('division');
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
                onSave={async () => {
                    await reloadSeasons();
                    if (onDivisionOrSeasonChanged) {
                        await onDivisionOrSeasonChanged('season');
                    }
                    setSeasonData(null);
                }}
                setSaveError={setSaveError}/>
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

    function firstValidDivisionNameForSeason(season) {
        if (originalDivisionData && (isEmpty(season.divisions) || any(season.divisions, d => d.id === originalDivisionData.id))) {
            return originalDivisionData.name;
        }

        if (any(season.divisions)) {
            return season.divisions[0].name;
        }

        return null;
    }

    function navigateToSeason() {
        navigate(`/division/${originalDivisionData.name}/${overrideMode || stripIdFromMode(mode) || 'teams'}/${originalSeasonData.name}`);
    }

    function renderSeasonOption(s) {
        return (<Link
            key={s.id}
            className={`dropdown-item ${originalSeasonData && originalSeasonData.id === s.id ? ' active' : ''}`}
            to={`/division/${firstValidDivisionNameForSeason(s)}/${overrideMode || mode || 'teams'}/${s.name}${location.search}`}>
            {s.name} ({renderDate(s.startDate)} - {renderDate(s.endDate)})
        </Link>);
    }

    function renderDivisionOption(d) {
        return (<Link
            key={d.id}
            className={`dropdown-item ${originalDivisionData.id === d.id ? ' active' : ''}${isDivisionSelected(d) ? '' : ' text-warning'}`}
            to={`/division/${d.name}/${overrideMode || stripIdFromMode(mode) || 'teams'}/${originalSeasonData.name}${location.search}`}>
            {d.name}
        </Link>);
    }

    try {
        return (<div className="btn-group py-2 d-print-none">
            {divisionData ? renderEditDivisionDialog() : null}
            {seasonData ? renderEditSeasonDialog() : null}
            <ButtonDropdown isOpen={openDropdown === 'season' || !originalSeasonData} toggle={() => {
                if (any(seasons)) {
                    toggleDropdown('season')
                }
            }}>
                <button className={`btn ${isSeasonAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}
                        onClick={isSeasonAdmin ? () => setSeasonData(toEditableSeason(originalSeasonData)) : navigateToSeason}>
                    {originalSeasonData
                        ? (<span>
                            {originalSeasonData.name} ({renderDate(originalSeasonData.startDate)} - {renderDate(originalSeasonData.endDate)})
                        </span>)
                        : (<span>Select a season</span>)}
                    {isSeasonAdmin && originalSeasonData ? '✏' : ''}
                </button>
                {seasons.length
                    ? (<DropdownToggle caret color={isSeasonAdmin ? 'info' : 'light'}></DropdownToggle>)
                    : null}
                {seasons.length ? (<DropdownMenu>
                    {seasons.sort(sortBy('startDate', true)).map(renderSeasonOption)}
                    {isSeasonAdmin ? (<button className="dropdown-item" onClick={() => setSeasonData({})}>
                        ➕ New season
                    </button>) : null}
                </DropdownMenu>) : null}
            </ButtonDropdown>
            {originalDivisionData && divisions && originalSeasonData ? (
                <ButtonDropdown isOpen={openDropdown === 'division'} toggle={() => {
                    if (any(divisions, shouldShowDivision)) {
                        toggleDropdown('division')
                    }
                }}>
                    <button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}
                            onClick={isDivisionAdmin ? () => setDivisionData(Object.assign({}, originalDivisionData)) : navigateToSeason}>
                        {originalDivisionData.name}
                        {isDivisionAdmin ? '✏' : ''}
                    </button>
                    {divisions.filter(shouldShowDivision).length > 1 || isDivisionAdmin ? (
                        <DropdownToggle caret color={isDivisionAdmin ? 'info' : 'light'}></DropdownToggle>) : null}
                    {divisions.filter(shouldShowDivision).length > 1 || isDivisionAdmin ? (<DropdownMenu>
                        {divisions.filter(shouldShowDivision).sort(sortBy('name')).map(renderDivisionOption)}
                        {isDivisionAdmin ? (<button className="dropdown-item" onClick={() => setDivisionData({})}>
                            ➕ New division
                        </button>) : null}
                    </DropdownMenu>) : null}
                </ButtonDropdown>) : null}
            {(!originalDivisionData || !divisions || !originalSeasonData) ? (<div className="btn-group">
                <button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}>
                    All divisions
                </button>
            </div>) : null}
            {saveError
                ? (<ErrorDisplay
                    {...saveError}
                    onClose={() => setSaveError(null)}
                    title="Could not save details"/>)
                : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
