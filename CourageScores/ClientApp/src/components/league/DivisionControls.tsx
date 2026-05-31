import {
    ButtonDropdown,
    DropdownMenu,
    DropdownToggle,
} from '../common/ButtonDropdown.tsx';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useState } from 'react';
import { ErrorDisplay } from '../common/ErrorDisplay.tsx';
import { Dialog } from '../common/Dialog.tsx';
import { EditDivision } from './EditDivision.tsx';
import { EditSeason } from './EditSeason.tsx';
import { any, isEmpty, sortBy } from '../../helpers/collections.ts';
import { renderDate } from '../../helpers/rendering.ts';
import { useApp } from '../common/AppContainer.tsx';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto.ts';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto.ts';
import { EditSeasonDto } from '../../interfaces/models/dtos/Season/EditSeasonDto.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';
import { asyncClear } from '../../helpers/events.ts';

export interface IDivisionControlsProps {
    originalSeasonData?: SeasonDto;
    onDivisionOrSeasonChanged?(
        preventReloadIfIdsAreTheSame?: boolean,
    ): UntypedPromise;
    originalDivisionData: DivisionDataDto;
    overrideMode?: string;
}

export function DivisionControls({
    originalSeasonData,
    onDivisionOrSeasonChanged,
    originalDivisionData,
    overrideMode,
}: IDivisionControlsProps) {
    const { mode } = useParams();
    const {
        account,
        divisions,
        reloadSeasons,
        reloadDivisions,
        onError,
        seasons,
    } = useApp();
    // noinspection JSUnresolvedVariable
    const isDivisionAdmin =
        account && account.access && account.access.manageDivisions;
    // noinspection JSUnresolvedVariable
    const isSeasonAdmin =
        account && account.access && account.access.manageSeasons;
    const [saveError, setSaveError] = useState<
        IClientActionResultDto<DivisionDto> | undefined
    >(undefined);
    const [seasonData, setSeasonData] = useState<SeasonDto | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [divisionData, setDivisionData] = useState<DivisionDataDto | null>(
        null,
    );
    const location = useLocation();
    const navigate = useNavigate();

    function toggleDropdown(name: string) {
        if (openDropdown === null || openDropdown !== name) {
            setOpenDropdown(name);
        } else {
            setOpenDropdown(null);
        }
    }

    function renderEditDivisionDialog() {
        return (
            <Dialog
                title={
                    divisionData!.id ? 'Edit a division' : 'Create a division'
                }
                slim={true}>
                <EditDivision
                    data={divisionData!}
                    onUpdateData={async (data: DivisionDataDto) =>
                        setDivisionData(data)
                    }
                    onClose={async () => setDivisionData(null)}
                    onSave={async (division: DivisionDto) => {
                        if (originalDivisionData) {
                            updateNameInAddress(
                                originalDivisionData.name,
                                division.name,
                            );
                        }
                        await reloadDivisions();
                        if (onDivisionOrSeasonChanged) {
                            await onDivisionOrSeasonChanged(false);
                        }
                        setDivisionData(null);
                    }}
                    setSaveError={async (
                        error: IClientActionResultDto<DivisionDto>,
                    ) => setSaveError(error)}
                />
            </Dialog>
        );
    }

    function updateNameInAddress(oldName: string, newName: string) {
        const newPath = location.pathname.replace(
            encodeURI(oldName),
            encodeURI(newName),
        );
        const oldSearch = new URLSearchParams(location.search);
        const newSearch = new URLSearchParams(location.search);
        for (const [key, value] of oldSearch.entries()) {
            if (value === oldName) {
                newSearch.set(key, newName);
            }
        }
        const newAddress = `${newPath}?${newSearch}${location.hash}`;
        navigate(newAddress);
    }

    function renderEditSeasonDialog() {
        return (
            <Dialog
                title={seasonData!.id ? 'Edit a season' : 'Create a season'}
                slim={true}>
                <EditSeason
                    data={seasonData!}
                    onUpdateData={async (season: SeasonDto) =>
                        setSeasonData(season)
                    }
                    onClose={async () => setSeasonData(null)}
                    onSave={async (season: SeasonDto) => {
                        if (originalSeasonData) {
                            updateNameInAddress(
                                originalSeasonData.name,
                                season.name,
                            );
                        }
                        await reloadSeasons();
                        if (onDivisionOrSeasonChanged) {
                            await onDivisionOrSeasonChanged(false);
                        }
                        setSeasonData(null);
                    }}
                    setSaveError={async (error) => setSaveError(error)}
                />
            </Dialog>
        );
    }

    function shouldShowDivision(division: DivisionDto) {
        return (
            (isSeasonAdmin && isDivisionAdmin) || isDivisionSelected(division)
        );
    }

    function isDivisionSelected(division: DivisionDto) {
        if (!originalSeasonData || !originalSeasonData.divisions) {
            return false;
        }

        return (
            isEmpty(originalSeasonData.divisions) ||
            any(originalSeasonData.divisions, (d) => d.id === division.id)
        );
    }

    function toEditableSeason(seasonData: SeasonDto) {
        const data: SeasonDto & EditSeasonDto = Object.assign({}, seasonData);
        data.divisionIds = (seasonData.divisions || []).map((d) => d.id);
        return data;
    }

    function firstValidDivisionForSeason(
        season: SeasonDto,
    ): DivisionDataDto | null {
        if (
            originalDivisionData &&
            (isEmpty(season.divisions) ||
                any(season.divisions, (d) => d.id === originalDivisionData.id))
        ) {
            return originalDivisionData;
        }

        if (any(season.divisions)) {
            return season.divisions![0];
        }

        return null;
    }

    function getSeasonDates(season: SeasonDto): string {
        return season.startDate && season.endDate
            ? ` (${renderDate(season.startDate)} - ${renderDate(season.endDate)})`
            : '';
    }

    function renderSeasonOption(season: SeasonDto) {
        const url: string = getDivisionUrl(
            firstValidDivisionForSeason(season)!,
            season.name,
            mode,
        );

        return (
            <Link
                key={season.id}
                className={`dropdown-item ${originalSeasonData && originalSeasonData.id === season.id ? ' active' : ''}`}
                to={url}>
                {season.name}
                {getSeasonDates(season)}
            </Link>
        );
    }

    function renderDivisionOption(division: DivisionDto) {
        const url: string = getDivisionUrl(
            division,
            originalSeasonData!.name,
            mode,
        );

        return (
            <Link
                key={division.id}
                className={`dropdown-item ${originalDivisionData.id === division.id ? ' active' : ''}${isDivisionSelected(division) ? '' : ' text-warning'}`}
                to={url}>
                {division.name}
            </Link>
        );
    }

    function getDivisionUrl(
        division: DivisionDataDto,
        seasonName: string,
        mode?: string,
    ): string {
        const navigateToMode: string =
            overrideMode ||
            mode ||
            (division.superleague ? 'fixtures' : 'teams');
        const search: string = location.search;

        switch (navigateToMode) {
            case 'teams':
            case 'players':
            case 'fixtures': {
                const params: URLSearchParams = new URLSearchParams(search);
                params.set('division', division.name);
                const newSearch: string = params.toString();

                return `/${navigateToMode}/${seasonName}/${newSearch ? '?' + newSearch : ''}`;
            }
            default: {
                return `/division/${division.name}/${navigateToMode}/${seasonName}${search}`;
            }
        }
    }

    try {
        return (
            <div className="btn-group py-2 d-print-none">
                {divisionData ? renderEditDivisionDialog() : null}
                {seasonData ? renderEditSeasonDialog() : null}
                <ButtonDropdown
                    isOpen={openDropdown === 'season' || !originalSeasonData}
                    datatype="season-selector"
                    toggle={() => toggleDropdown('season')}>
                    <button
                        className={`btn ${isSeasonAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}
                        onClick={
                            isSeasonAdmin
                                ? () =>
                                      setSeasonData(
                                          toEditableSeason(originalSeasonData!),
                                      )
                                : () => toggleDropdown('season')
                        }>
                        {originalSeasonData ? (
                            <span>
                                {originalSeasonData.name}
                                {getSeasonDates(originalSeasonData)}
                            </span>
                        ) : (
                            <span>Select a season</span>
                        )}
                        {isSeasonAdmin && originalSeasonData ? '✏' : ''}
                    </button>
                    {seasons.length || isSeasonAdmin ? (
                        <DropdownToggle
                            color={
                                isSeasonAdmin ? 'info' : 'light'
                            }></DropdownToggle>
                    ) : null}
                    {seasons.length || isSeasonAdmin ? (
                        <DropdownMenu>
                            {seasons
                                .sort(sortBy('startDate', true))
                                .map(renderSeasonOption)}
                            {isSeasonAdmin ? (
                                <button
                                    className="dropdown-item"
                                    onClick={() =>
                                        setSeasonData({} as SeasonDto)
                                    }>
                                    ➕ New season
                                </button>
                            ) : null}
                        </DropdownMenu>
                    ) : null}
                </ButtonDropdown>
                {originalDivisionData && divisions && originalSeasonData ? (
                    <ButtonDropdown
                        isOpen={openDropdown === 'division'}
                        datatype="division-selector"
                        toggle={() => {
                            if (
                                any(divisions, shouldShowDivision) ||
                                isDivisionAdmin
                            ) {
                                toggleDropdown('division');
                            }
                        }}>
                        <button
                            className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}
                            onClick={
                                isDivisionAdmin
                                    ? () =>
                                          setDivisionData(
                                              Object.assign(
                                                  {},
                                                  originalDivisionData,
                                              ),
                                          )
                                    : () => toggleDropdown('division')
                            }>
                            {originalDivisionData.name}
                            {isDivisionAdmin ? '✏' : ''}
                        </button>
                        {divisions.filter(shouldShowDivision).length > 1 ||
                        isDivisionAdmin ? (
                            <DropdownToggle
                                color={
                                    isDivisionAdmin ? 'info' : 'light'
                                }></DropdownToggle>
                        ) : null}
                        {divisions.filter(shouldShowDivision).length > 1 ||
                        isDivisionAdmin ? (
                            <DropdownMenu>
                                {divisions
                                    .filter(shouldShowDivision)
                                    .sort(sortBy('name'))
                                    .map(renderDivisionOption)}
                                {isDivisionAdmin ? (
                                    <button
                                        className="dropdown-item"
                                        onClick={() =>
                                            setDivisionData({} as DivisionDto)
                                        }>
                                        ➕ New division
                                    </button>
                                ) : null}
                            </DropdownMenu>
                        ) : null}
                    </ButtonDropdown>
                ) : null}
                {!originalDivisionData || !divisions || !originalSeasonData ? (
                    <div className="btn-group">
                        <button
                            className={`btn ${isDivisionAdmin ? 'btn-info' : 'btn-light'} text-nowrap`}>
                            All divisions
                        </button>
                    </div>
                ) : null}
                {saveError ? (
                    <ErrorDisplay
                        {...saveError}
                        onClose={asyncClear(setSaveError)}
                        title="Could not save details"
                    />
                ) : null}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
