import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {Link, useParams} from "react-router-dom";
import React, {useState} from "react";
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
            <ButtonDropdown isOpen={openDropdown === 'division'} toggle={() => { if (divisions.filter(shouldShowDivision).length > 0) { toggleDropdown('division') } } }>
                <button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={isDivisionAdmin ? () => setDivisionData(Object.assign({}, originalDivisionData)) : null}>
                    {originalDivisionData.name}
                    {isDivisionAdmin ? '✏' : ''}
                </button>
                {divisions.filter(shouldShowDivision).length > 1 || isDivisionAdmin ? (<DropdownToggle caret color={isDivisionAdmin ? 'info' : 'light'}></DropdownToggle>) : null}
                {divisions.filter(shouldShowDivision).length > 1 || isDivisionAdmin ? (<DropdownMenu>
                    {divisions.filter(shouldShowDivision).map(d => (<DropdownItem key={d.id}>
                        <Link className="btn" to={`/division/${d.id}/${overrideMode || stripIdFromMode(mode) || 'teams'}/${originalSeasonData.id}`}>{d.name}</Link>
                    </DropdownItem>))}
                    {isDivisionAdmin ? (<DropdownItem>
                        <span className="btn" onClick={() => setDivisionData({})}>➕ New division</span>
                    </DropdownItem>) : null}
                </DropdownMenu>) : null}
            </ButtonDropdown>) : null}
        {(!originalDivisionData || !divisions) ? (<div className="btn-group"><button className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}>All divisions</button></div>) : null}
        <ButtonDropdown isOpen={openDropdown === 'season'} toggle={() => { if (seasons.length > 0) { toggleDropdown('season') } }}>
            <button className={`btn ${isSeasonAdmin ? 'btn-info' : 'btn-light'} text-nowrap`} onClick={isSeasonAdmin ? () => setSeasonData(toEditableSeason(originalSeasonData)) : null}>
                {originalSeasonData.name} ({renderDate(originalSeasonData.startDate)} - {renderDate(originalSeasonData.endDate)})
                {isSeasonAdmin ? '✏' : ''}
            </button>
            {originalSeasonData ? (<DropdownToggle caret color={isSeasonAdmin ? 'info' : 'light'}></DropdownToggle>) : null}
            {originalSeasonData ? (<DropdownMenu>
                {seasons.map(s => (<DropdownItem key={s.id}>
                    <Link className="btn" to={`/division/${originalDivisionData.id}/${overrideMode || mode || 'teams'}/${s.id}`}>{s.name} ({renderDate(s.startDate)} - {renderDate(s.endDate)})</Link>
                </DropdownItem>))}
                {isSeasonAdmin ? (<DropdownItem>
                    <span onClick={() => setSeasonData({})} className="btn">➕ New season</span>
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
