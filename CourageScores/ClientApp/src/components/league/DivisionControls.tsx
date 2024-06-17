import {ButtonDropdown, DropdownMenu, DropdownToggle} from "reactstrap";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {useState} from "react";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {Dialog} from "../common/Dialog";
import {EditDivision} from "./EditDivision";
import {EditSeason} from "./EditSeason";
import {any, isEmpty, sortBy} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {useApp} from "../common/AppContainer";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {DivisionDataSeasonDto} from "../../interfaces/models/dtos/Division/DivisionDataSeasonDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {EditSeasonDto} from "../../interfaces/models/dtos/Season/EditSeasonDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";

export interface IDivisionControlsProps {
    originalSeasonData: DivisionDataSeasonDto;
    onDivisionOrSeasonChanged?(preventReloadIfIdsAreTheSame?: boolean): Promise<any>;
    originalDivisionData: DivisionDataDto;
    overrideMode?: string;
}

export function DivisionControls({originalSeasonData, onDivisionOrSeasonChanged, originalDivisionData, overrideMode}: IDivisionControlsProps) {
    const {mode} = useParams();
    const {account, divisions, reloadSeasons, reloadDivisions, onError, seasons} = useApp();
    // noinspection JSUnresolvedVariable
    const isDivisionAdmin = account && account.access && account.access.manageDivisions;
    // noinspection JSUnresolvedVariable
    const isSeasonAdmin = account && account.access && account.access.manageSeasons;
    const [saveError, setSaveError] = useState<any | null>(null);
    const [seasonData, setSeasonData] = useState<DivisionDataSeasonDto | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [divisionData, setDivisionData] = useState<DivisionDataDto | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    function toggleDropdown(name: string) {
        if (openDropdown === null || openDropdown !== name) {
            setOpenDropdown(name);
        } else {
            setOpenDropdown(null);
        }
    }

    function stripIdFromMode(mode?: string) {
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
                onUpdateData={async (data: DivisionDataDto) => setDivisionData(data)}
                onClose={async () => setDivisionData(null)}
                onSave={async () => {
                    await reloadDivisions();
                    if (onDivisionOrSeasonChanged) {
                        await onDivisionOrSeasonChanged(false);
                    }
                    setDivisionData(null);
                }}
                setSaveError={async (error: IClientActionResultDto<DivisionDto>) => setSaveError(error)}/>
        </Dialog>);
    }

    function renderEditSeasonDialog() {
        return (<Dialog title={seasonData.id ? 'Edit a season' : 'Create a season'} slim={true}>
            <EditSeason
                data={seasonData}
                onUpdateData={async (season: SeasonDto) => setSeasonData(season)}
                onClose={async () => setSeasonData(null)}
                onSave={async () => {
                    await reloadSeasons();
                    if (onDivisionOrSeasonChanged) {
                        await onDivisionOrSeasonChanged(false);
                    }
                    setSeasonData(null);
                }}
                setSaveError={async (error: any) => setSaveError(error)}/>
        </Dialog>);
    }

    function shouldShowDivision(division: DivisionDto) {
        return (isSeasonAdmin && isDivisionAdmin) || isDivisionSelected(division);
    }

    function isDivisionSelected(division: DivisionDto) {
        if (!originalSeasonData || !originalSeasonData.divisions) {
            return false;
        }

        return isEmpty(originalSeasonData.divisions)
            || any(originalSeasonData.divisions, d => d.id === division.id);
    }

    function toEditableSeason(seasonData: DivisionDataSeasonDto) {
        const data: DivisionDataSeasonDto & EditSeasonDto = Object.assign({}, seasonData);
        data.divisionIds = (seasonData.divisions || []).map(d => d.id);
        return data;
    }

    function firstValidDivisionNameForSeason(season: DivisionDataSeasonDto) {
        if (originalDivisionData && (isEmpty(season.divisions) || any(season.divisions, d => d.id === originalDivisionData.id))) {
            return originalDivisionData.name;
        }

        if (any(season.divisions)) {
            return season.divisions[0].name;
        }

        return null;
    }

    function navigateToSeason() {
        const url: string = getDivisionUrl(originalDivisionData.name, originalSeasonData.name, stripIdFromMode(mode));
        navigate(url);
    }

    function renderSeasonOption(season: SeasonDto) {
        const url: string = getDivisionUrl(firstValidDivisionNameForSeason(season), season.name, mode);

        return (<Link
            key={season.id}
            className={`dropdown-item ${originalSeasonData && originalSeasonData.id === season.id ? ' active' : ''}`}
            to={url}>
            {season.name} ({renderDate(season.startDate)} - {renderDate(season.endDate)})
        </Link>);
    }

    function renderDivisionOption(division: DivisionDto) {
        const url: string = getDivisionUrl(division.name, originalSeasonData.name, mode);

        return (<Link
            key={division.id}
            className={`dropdown-item ${originalDivisionData.id === division.id ? ' active' : ''}${isDivisionSelected(division) ? '' : ' text-warning'}`}
            to={url}>
            {division.name}
        </Link>);
    }

    function getDivisionUrl(divisionName: string, seasonName: string, mode: string): string {
        const navigateToMode: string = overrideMode || mode || 'teams';
        const search: string = location.search;

        switch (navigateToMode) {
            case 'teams':
            case 'players':
            case 'fixtures':
                const params = new URLSearchParams(search);
                params.set('division', divisionName);
                const newSearch: string = params.toString();

                return `/${navigateToMode}/${seasonName}/${(newSearch ? '?' + newSearch : '')}`;
            default:
                return `/division/${divisionName}/${navigateToMode}/${seasonName}${search}`;
        }
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
                    {isSeasonAdmin ? (<button className="dropdown-item" onClick={() => setSeasonData({} as SeasonDto)}>
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
                        {isDivisionAdmin ? (<button className="dropdown-item" onClick={() => setDivisionData({} as DivisionDto)}>
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
