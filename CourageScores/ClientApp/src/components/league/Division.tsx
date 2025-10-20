import { useEffect, useState } from 'react';
import { DivisionTeams } from '../division_teams/DivisionTeams';
import { DivisionFixtures } from '../division_fixtures/DivisionFixtures';
import { DivisionPlayers } from '../division_players/DivisionPlayers';
import { DivisionControls } from './DivisionControls';
import { DivisionReports } from '../division_reports/DivisionReports';
import { TeamOverview } from '../division_teams/TeamOverview';
import {
    IPlayerOverviewProps,
    PlayerOverview,
} from '../division_players/PlayerOverview';
import { Loading } from '../common/Loading';
import { all, any } from '../../helpers/collections';
import { asyncCallback, propChanged } from '../../helpers/events';
import { useDependencies } from '../common/IocContainer';
import { useApp } from '../common/AppContainer';
import { DivisionDataContainer } from './DivisionDataContainer';
import { isGuid } from '../../helpers/projection';
import { DivisionHealth } from '../division_health/DivisionHealth';
import { DataError } from './DataError';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { DivisionTeamDto } from '../../interfaces/models/dtos/Division/DivisionTeamDto';
import { DivisionPlayerDto } from '../../interfaces/models/dtos/Division/DivisionPlayerDto';
import { DataErrorDto } from '../../interfaces/models/dtos/Division/DataErrorDto';
import { IFailedRequest } from '../common/IFailedRequest';
import { DivisionDataFilter } from '../../interfaces/models/dtos/Division/DivisionDataFilter';
import { ConfiguredFeatureDto } from '../../interfaces/models/dtos/ConfiguredFeatureDto';
import { INVALID, useDivisionUri } from './DivisionUriContainer';
import { IIdish } from './IDivisionUri';
import { IError } from '../common/IError';
import { NavLink } from '../common/NavLink';

export interface IRequestedDivisionDataDto
    extends DivisionDataDto,
        IFailedRequest {
    requested?: { divisionId: string[]; seasonId: string };
}

export function Division() {
    const { divisionApi, featureApi } = useDependencies();
    const { account, onError, error, seasons, controls, divisions } = useApp();
    const { requestedDivisions, requestedSeason, requestedMode } =
        useDivisionUri();
    const [divisionData, setDivisionData] =
        useState<IRequestedDivisionDataDto | null>(null);
    const [overrideDivisionData, setOverrideDivisionData] = useState<
        DivisionDataDto | undefined
    >(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [dataRequested, setDataRequested] = useState<boolean>(false);
    const effectiveTab = requestedMode || 'teams';
    const [dataErrors, setDataErrors] = useState<DataErrorDto[] | null>(null);
    const [favouritesEnabled, setFavouritesEnabled] = useState<boolean>(false);

    function getPlayerProps(idish?: string): IPlayerOverviewProps {
        if (isGuid(idish)) {
            return {
                playerId: idish!,
            };
        }

        if (!divisionData || !idish) {
            return {
                playerId: null!,
            };
        }

        const matchItem = idish.matchAll(/(.+)@(.+)/g).next();
        const match: string = matchItem.value;
        if (!match || match.length < 3) {
            return {
                playerId: idish,
            };
        }

        const playerName: string = match[1];
        const teamName: string = match[2];

        const team: DivisionTeamDto = divisionData.teams!.filter(
            (t: DivisionTeamDto) =>
                t.name.toLowerCase() === teamName.toLowerCase(),
        )[0];
        if (!team) {
            // team not found
            return {
                playerId: idish,
                teamName: teamName,
                playerName: playerName,
            };
        }

        const teamPlayer: DivisionPlayerDto = divisionData.players!.filter(
            (p: DivisionPlayerDto) =>
                p.teamId === team.id &&
                p.name.toLowerCase() === playerName.toLowerCase(),
        )[0];
        return {
            playerId: teamPlayer ? teamPlayer.id! : INVALID.id,
            teamName: teamName,
            playerName: playerName,
        };
    }

    function getTeamId(idish?: string): string | undefined {
        if (isGuid(idish)) {
            return idish;
        }

        if (!divisionData || !idish) {
            return undefined;
        }

        const team = divisionData.teams!.filter(
            (t: DivisionTeamDto) =>
                t.name.toLowerCase() === idish.toLowerCase(),
        )[0];
        return team ? team.id : INVALID.id;
    }

    async function reloadDivisionData(
        preventReloadIfIdsAreTheSame?: boolean,
    ): Promise<DivisionDataDto | null> {
        const requestedDivisionIds: string[] = (requestedDivisions || [])
            .map((idish: IIdish) => (idish ? idish.id : null))
            .filter((id: string | null) => !!id)
            .map((id) => id!);
        const requestedSeasonId: string | null = requestedSeason
            ? requestedSeason.id
            : null;
        try {
            if (
                divisionData &&
                divisionData.requested &&
                divisionData.requested.divisionId.join(',') ===
                    requestedDivisionIds.join(',') &&
                divisionData.requested.seasonId === requestedSeasonId
            ) {
                // repeated call... don't request the data
                if (preventReloadIfIdsAreTheSame) {
                    return null;
                }
            }

            const filter: DivisionDataFilter = {
                divisionId: requestedDivisionIds,
            };
            if (requestedSeasonId) {
                filter.seasonId = requestedSeasonId;
            }

            const newDivisionData: IRequestedDivisionDataDto =
                await divisionApi.data(filter);
            newDivisionData.requested = {
                divisionId: requestedDivisionIds,
                seasonId: requestedSeasonId!,
            };

            if (newDivisionData.status) {
                /* istanbul ignore next */
                console.log(newDivisionData);
                const suffix = newDivisionData.errors
                    ? ' -- ' +
                      Object.keys(newDivisionData.errors)
                          .map(
                              (key: string) =>
                                  `${key}: ${newDivisionData.errors![key]}`,
                          )
                          .join(', ')
                    : '';
                onError(
                    `Error accessing division: Code: ${newDivisionData.status}${suffix}`,
                );
            } else if (
                requestedSeason &&
                (newDivisionData.season || {}).id !== requestedSeasonId
            ) {
                /* istanbul ignore next */
                console.log(newDivisionData);
                onError(
                    `Data for a different season returned, requested: ${requestedSeason}`,
                );
            }

            if (any(newDivisionData.dataErrors)) {
                setDataErrors(newDivisionData.dataErrors!);
            } else {
                setDataErrors(null);
            }

            setDivisionData(newDivisionData);

            return newDivisionData;
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
            setDivisionData({
                name: '',
                status: 500,
                errors: {
                    Exception: [(e as IError).message!],
                },
                requested: {
                    divisionId: requestedDivisionIds,
                    seasonId: requestedSeasonId!,
                },
            });

            return null;
        } finally {
            setLoading(false);
        }
    }

    async function updateFavouritesEnabled() {
        const result: ConfiguredFeatureDto[] = await featureApi.getFeatures();
        const favouritesEnabled: boolean = any(
            result,
            (feature) =>
                feature.id === '0edb9fc6-6579-4c4c-9506-77c2485c09a0' &&
                feature.configuredValue === 'true',
        );
        setFavouritesEnabled(favouritesEnabled);
    }

    useEffect(
        () => {
            // noinspection JSIgnoredPromiseFromCall
            updateFavouritesEnabled();
        },
        // eslint-disable-next-line
        [],
    );

    useEffect(
        () => {
            if (loading || error) {
                return;
            }

            function beginReload() {
                setDataRequested(true);

                if (
                    any(
                        requestedDivisions,
                        (d: IIdish) => !!d.id && d !== INVALID,
                    ) &&
                    requestedSeason !== INVALID
                ) {
                    setLoading(true);
                    // noinspection JSIgnoredPromiseFromCall
                    reloadDivisionData(true);
                }
            }

            try {
                if (!requestedDivisions) {
                    return;
                }

                if (!divisionData) {
                    beginReload();
                    return;
                }
                if (divisionData.status) {
                    // don't reload if there was a previous 'status' - representing an issue loading the data
                    return;
                }

                const requestedDivisionIds: string[] = any(requestedDivisions)
                    ? requestedDivisions.map((d: IIdish) => d.id)
                    : [];
                const requestedSeasonId: string | null = requestedSeason
                    ? requestedSeason.id
                    : null;
                const dataLoadedForSameSeason: boolean =
                    (divisionData.requested &&
                        divisionData.requested.seasonId ===
                            requestedSeasonId) ||
                    false;
                const dataLoadedForSameDivisions: boolean =
                    (divisionData.requested &&
                        all(
                            requestedDivisionIds,
                            (requestedDivisionId: string) =>
                                any(
                                    divisionData.requested!.divisionId,
                                    (loadedDivisionId: string) =>
                                        loadedDivisionId ===
                                        requestedDivisionId,
                                ),
                        )) ||
                    false;

                if (!dataLoadedForSameSeason || !dataLoadedForSameDivisions) {
                    beginReload();
                }
            } catch (e) {
                /* istanbul ignore next */
                onError(e);
            }
        },
        // eslint-disable-next-line
        [
            divisionData,
            loading,
            requestedDivisions,
            requestedSeason,
            error,
            seasons,
        ],
    );

    function toQueryString(ids?: IIdish[]): string {
        return '?' + ids?.map((id: IIdish) => `division=${id}`).join('&');
    }

    if (loading || !dataRequested) {
        return <Loading />;
    }

    const divisionDataToUse = overrideDivisionData ||
        divisionData || {
            season: {
                id: undefined!,
                startDate: undefined!,
                endDate: undefined!,
                name: 'No Season',
            },
            name: 'No Division',
            id: undefined!,
            superleague: undefined,
            updated: undefined,
        };
    if (
        !overrideDivisionData &&
        !divisionData &&
        divisions.length > 0 &&
        seasons.length > 0
    ) {
        return (
            <div className="p-3 content-background">
                Requested division/season could not be found
            </div>
        );
    }

    try {
        return (
            <div>
                {controls || !divisionDataToUse.season ? (
                    <DivisionControls
                        originalSeasonData={divisionDataToUse.season!}
                        originalDivisionData={{
                            name: divisionDataToUse.name,
                            id: divisionDataToUse.id,
                            updated: divisionDataToUse.updated,
                            superleague: divisionDataToUse.superleague,
                        }}
                        onDivisionOrSeasonChanged={reloadDivisionData}
                        overrideMode={requestedMode}
                    />
                ) : null}
                {controls ? (
                    <ul className="nav nav-tabs d-print-none">
                        <li className="nav-item">
                            <NavLink
                                className={
                                    effectiveTab === 'teams' ? 'active' : ''
                                }
                                to={`/teams${requestedSeason ? '/' + requestedSeason : ''}/${toQueryString(requestedDivisions)}`}>
                                Teams
                            </NavLink>
                        </li>
                        {effectiveTab.startsWith('team:') ? (
                            <li className="nav-item">
                                <NavLink
                                    className="active"
                                    to={`/teams${requestedSeason ? '/' + requestedSeason : ''}/${toQueryString(requestedDivisions)}`}>
                                    Team Details
                                </NavLink>
                            </li>
                        ) : null}
                        <li className="nav-item">
                            <NavLink
                                className={
                                    effectiveTab === 'fixtures' ? 'active' : ''
                                }
                                to={`/fixtures${requestedSeason ? '/' + requestedSeason : ''}/${toQueryString(requestedDivisions)}`}>
                                Fixtures
                            </NavLink>
                        </li>
                        {divisionDataToUse!.superleague ? null : (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'players'
                                            ? 'active'
                                            : ''
                                    }
                                    to={`/players${requestedSeason ? '/' + requestedSeason : ''}/${toQueryString(requestedDivisions)}`}>
                                    Players
                                </NavLink>
                            </li>
                        )}
                        {effectiveTab.startsWith('player:') ? (
                            <li className="nav-item">
                                <NavLink
                                    className="active"
                                    to={`/teams${requestedSeason ? '/' + requestedSeason : ''}/${toQueryString(requestedDivisions)}`}>
                                    {getPlayerProps(
                                        effectiveTab.substring(
                                            'player:'.length,
                                        ),
                                    ).playerName || 'Player Details'}
                                </NavLink>
                            </li>
                        ) : null}
                        {account &&
                        account.access &&
                        account.access.runReports &&
                        requestedDivisions!.length === 1 &&
                        !divisionDataToUse!.superleague ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'reports'
                                            ? 'active'
                                            : ''
                                    }
                                    to={`/division/${requestedDivisions}/reports${requestedSeason ? '/' + requestedSeason : ''}`}>
                                    Reports
                                </NavLink>
                            </li>
                        ) : null}
                        {account &&
                        account.access &&
                        account.access.runHealthChecks &&
                        requestedDivisions!.length === 1 &&
                        !divisionDataToUse!.superleague ? (
                            <li className="nav-item">
                                <NavLink
                                    className={
                                        effectiveTab === 'health'
                                            ? 'active'
                                            : ''
                                    }
                                    to={`/division/${requestedDivisions}/health${requestedSeason ? '/' + requestedSeason : ''}`}>
                                    Health
                                </NavLink>
                            </li>
                        ) : null}
                    </ul>
                ) : null}
                {dataErrors && account ? (
                    <div className="content-background p-3">
                        <h3>⚠ Errors in division data</h3>
                        <ol>
                            {dataErrors.map((error, index) => {
                                return (
                                    <DataError key={index} dataError={error} />
                                );
                            })}
                        </ol>
                        <button
                            className="btn btn-primary"
                            onClick={() => setDataErrors(null)}>
                            Hide errors
                        </button>
                    </div>
                ) : (
                    <DivisionDataContainer
                        {...divisionDataToUse}
                        onReloadDivision={reloadDivisionData}
                        favouritesEnabled={favouritesEnabled}
                        setDivisionData={asyncCallback(
                            setOverrideDivisionData,
                        )}>
                        {effectiveTab === 'teams' &&
                        divisionDataToUse.season ? (
                            <DivisionTeams />
                        ) : null}
                        {effectiveTab === 'fixtures' &&
                        divisionDataToUse.season ? (
                            <DivisionFixtures
                                setNewFixtures={propChanged(
                                    divisionDataToUse,
                                    setDivisionData,
                                    'fixtures',
                                )}
                            />
                        ) : null}
                        {effectiveTab === 'players' &&
                        divisionDataToUse.season ? (
                            <DivisionPlayers />
                        ) : null}
                        {effectiveTab === 'reports' &&
                        divisionDataToUse.season &&
                        account &&
                        account.access &&
                        account.access.runReports ? (
                            <DivisionReports />
                        ) : null}
                        {effectiveTab === 'health' &&
                        divisionDataToUse.season &&
                        account &&
                        account.access &&
                        account.access.runHealthChecks ? (
                            <DivisionHealth />
                        ) : null}
                        {effectiveTab &&
                        effectiveTab.startsWith('team:') &&
                        divisionDataToUse.season ? (
                            <TeamOverview
                                teamId={
                                    getTeamId(
                                        effectiveTab.substring('team:'.length),
                                    )!
                                }
                            />
                        ) : null}
                        {effectiveTab &&
                        effectiveTab.startsWith('player:') &&
                        divisionDataToUse.season ? (
                            <PlayerOverview
                                {...getPlayerProps(
                                    effectiveTab.substring('player:'.length),
                                )}
                            />
                        ) : null}
                    </DivisionDataContainer>
                )}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
