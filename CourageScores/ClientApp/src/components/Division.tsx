import React, {useEffect, useState} from 'react';
import {Link, useParams} from "react-router-dom";
import {NavLink} from "reactstrap";
import {DivisionTeams} from "./division_teams/DivisionTeams";
import {DivisionFixtures} from "./division_fixtures/DivisionFixtures";
import {DivisionPlayers} from "./division_players/DivisionPlayers";
import {DivisionControls} from "./DivisionControls";
import {DivisionReports} from "./division_reports/DivisionReports";
import {TeamOverview} from "./division_teams/TeamOverview";
import {PlayerOverview} from "./division_players/PlayerOverview";
import {Loading} from "./common/Loading";
import {any} from "../helpers/collections";
import {propChanged} from "../helpers/events";
import {useDependencies} from "../IocContainer";
import {useApp} from "../AppContainer";
import {DivisionDataContainer} from "./DivisionDataContainer";
import {isGuid} from "../helpers/projection";
import {EmbedAwareLink} from "./common/EmbedAwareLink";
import {DivisionHealth} from "./division_health/DivisionHealth";
import {DataError} from "./DataError";
import {IDivisionDataDto} from "../interfaces/serverSide/Division/IDivisionDataDto";
import {IDivisionDto} from "../interfaces/serverSide/IDivisionDto";
import {ISeasonDto} from "../interfaces/serverSide/Season/ISeasonDto";
import {IDivisionTeamDto} from "../interfaces/serverSide/Division/IDivisionTeamDto";
import {IDivisionPlayerDto} from "../interfaces/serverSide/Division/IDivisionPlayerDto";
import {IDataErrorDto} from "../interfaces/serverSide/Division/IDataErrorDto";

export interface IRequestedDivisionDataDto extends IDivisionDataDto {
    requested?: { divisionId: string, seasonId: string };
    status?: number;
    errors?: { [key: string]: string };
}

export function Division() {
    const INVALID = 'INVALID';
    const {divisionApi} = useDependencies();
    const {account, onError, error, divisions, seasons, controls} = useApp();
    const {divisionId: divisionIdish, mode, seasonId: seasonIdish} = useParams();
    const [divisionData, setDivisionData] = useState<IRequestedDivisionDataDto | null>(null);
    const [overrideDivisionData, setOverrideDivisionData] = useState<IDivisionDataDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [dataRequested, setDataRequested] = useState(false);
    const effectiveTab = mode || 'teams';
    const [dataErrors, setDataErrors] = useState<IDataErrorDto[] | null>(null);
    const divisionId = getDivisionId(divisionIdish);
    const seasonId = getSeasonId(seasonIdish);

    function getDivisionId(idish?: string) {
        if (isGuid(idish)) {
            return idish;
        }

        if (!divisions || !any(divisions) || !idish) {
            return null;
        }

        const division = divisions.filter((d: IDivisionDto) => d.name.toLowerCase() === idish.toLowerCase())[0];
        return division ? division.id : INVALID;
    }

    function getSeasonId(idish?: string) {
        if (isGuid(idish)) {
            return idish;
        }

        if (!seasons || !any(seasons) || !idish) {
            return null;
        }

        const season = seasons.filter((s: ISeasonDto) => s.name.toLowerCase() === idish.toLowerCase())[0];
        return season ? season.id : INVALID;
    }

    function getPlayerId(idish?: string) {
        if (isGuid(idish)) {
            return idish;
        }

        if (!divisionData || !idish) {
            return null;
        }

        const matchItem = idish.matchAll(/(.+)@(.+)/g).next();
        const match = matchItem.value;
        if (!match || match.length < 3) {
            return idish;
        }

        const playerName = match[1];
        const teamName = match[2];

        const team = divisionData.teams.filter((t: IDivisionTeamDto) => t.name.toLowerCase() === teamName.toLowerCase())[0];
        if (!team) {
            // team not found
            return idish;
        }

        const teamPlayer = divisionData.players.filter((p: IDivisionPlayerDto) => p.teamId === team.id && p.name.toLowerCase() === playerName.toLowerCase())[0];
        return teamPlayer ? teamPlayer.id : INVALID;
    }

    function getTeamId(idish?: string) {
        if (isGuid(idish)) {
            return idish;
        }

        if (!divisionData || !idish) {
            return null;
        }

        const team = divisionData.teams.filter((t: IDivisionTeamDto) => t.name.toLowerCase() === idish.toLowerCase())[0];
        return team ? team.id : INVALID;
    }

    async function reloadDivisionData(preventReloadIfIdsAreTheSame?: boolean) {
        try {
            if (divisionData && divisionData.requested && divisionData.requested.divisionId === divisionId && divisionData.requested.seasonId === seasonId) {
                // repeated call... don't request the data
                if (preventReloadIfIdsAreTheSame) {
                    return;
                }
            }

            const newDivisionData: IRequestedDivisionDataDto = await divisionApi.data(divisionId, seasonId);
            newDivisionData.requested = {
                divisionId,
                seasonId,
            };

            if (newDivisionData.status) {
                /* istanbul ignore next */
                console.log(newDivisionData);
                const suffix = newDivisionData.errors ? ' -- ' + Object.keys(newDivisionData.errors).map(key => `${key}: ${newDivisionData.errors![key]}`).join(', ') : '';
                onError(`Error accessing division: Code: ${newDivisionData.status}${suffix}`);
            } else if (newDivisionData.id !== divisionId) {
                /* istanbul ignore next */
                console.log(newDivisionData);
                onError(`Data for a different division returned, requested: ${divisionId}`);
            } else if (seasonId && (newDivisionData.season || {}).id !== seasonId) {
                /* istanbul ignore next */
                console.log(newDivisionData);
                onError(`Data for a different season returned, requested: ${seasonId}`);
            }

            if (any(newDivisionData.dataErrors || [])) {
                setDataErrors(newDivisionData.dataErrors);
            } else {
                setDataErrors(null);
            }

            setDivisionData(newDivisionData);

            return newDivisionData;
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
            if (loading || error) {
                return;
            }
            if (!seasons.length) {
                return;
            }

            function beginReload() {
                setDataRequested(true);

                if (divisionId !== INVALID && seasonId !== INVALID) {
                    setLoading(true);
                    // noinspection JSIgnoredPromiseFromCall
                    reloadDivisionData(true);
                }
            }

            try {
                if (!divisionId) {
                    return;
                }

                if (!divisionData) {
                    beginReload();
                    return;
                }
                if (divisionData.status) {
                    // dont reload if there was a previous 'status' - representing an issue loading the data
                    return;
                }
                if ((divisionData.id !== divisionId) || (seasonId && (divisionData.season || {}).id !== seasonId)) {
                    beginReload();
                }
            } catch (e) {
                /* istanbul ignore next */
                onError(e);
            }
        },
        // eslint-disable-next-line
        [divisionData, loading, divisionId, seasonId, error, seasons]);

    if (loading || !dataRequested) {
        return (<Loading/>);
    }

    const divisionDataToUse = overrideDivisionData || divisionData;
    if (!divisionDataToUse) {
        return (<div className="p-3 content-background">
            No data found
        </div>);
    }

    try {
        return (<div>
            {controls || !divisionDataToUse.season ? (<DivisionControls
                originalSeasonData={divisionDataToUse.season}
                originalDivisionData={{
                    name: divisionDataToUse.name,
                    id: divisionDataToUse.id,
                    updated: divisionDataToUse.updated
                }}
                onDivisionOrSeasonChanged={reloadDivisionData}/>) : null}
            {controls ? (<ul className="nav nav-tabs d-print-none">
                <li className="nav-item">
                    <NavLink tag={Link}
                             className={effectiveTab === 'teams' ? 'active' : ''}
                             to={`/division/${divisionIdish}/teams${seasonIdish ? '/' + seasonIdish : ''}`}>Teams</NavLink>
                </li>
                {effectiveTab.startsWith('team:') ? (<li className="nav-item">
                    <NavLink tag={Link}
                             className="active"
                             to={`/division/${divisionIdish}/teams${seasonIdish ? '/' + seasonIdish : ''}`}>
                        Team Details
                    </NavLink>
                </li>) : null}
                <li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'fixtures' ? 'active' : ''}
                             to={`/division/${divisionIdish}/fixtures${seasonIdish ? '/' + seasonIdish : ''}`}>Fixtures</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink tag={Link}
                             className={effectiveTab === 'players' ? 'active' : ''}
                             to={`/division/${divisionIdish}/players${seasonIdish ? '/' + seasonIdish : ''}`}>Players</NavLink>
                </li>
                {effectiveTab.startsWith('player:') ? (<li className="nav-item">
                    <NavLink tag={Link}
                             className="active"
                             to={`/division/${divisionIdish}/teams${seasonIdish ? '/' + seasonIdish : ''}`}>
                        Player Details
                    </NavLink>
                </li>) : null}
                {account && account.access && account.access.runReports ? (<li className="nav-item">
                    <NavLink tag={EmbedAwareLink} className={effectiveTab === 'reports' ? 'active' : ''}
                             to={`/division/${divisionIdish}/reports${seasonIdish ? '/' + seasonIdish : ''}`}>Reports</NavLink>
                </li>) : null}
                {account && account.access && account.access.runHealthChecks ? (<li className="nav-item">
                    <NavLink tag={EmbedAwareLink} className={effectiveTab === 'health' ? 'active' : ''}
                             to={`/division/${divisionIdish}/health${seasonIdish ? '/' + seasonIdish : ''}`}>Health</NavLink>
                </li>) : null}
            </ul>) : null}
            {dataErrors && account ? (<div className="content-background p-3">
                <h3>⚠ Errors in division data</h3>
                <ol>
                    {dataErrors.map((error, index) => {
                        return (<DataError key={index} dataError={error} />);
                    })}
                </ol>
                <button className="btn btn-primary" onClick={() => setDataErrors(null)}>Hide errors</button>
            </div>) : (<DivisionDataContainer {...divisionDataToUse} onReloadDivision={reloadDivisionData}
                                              setDivisionData={async (data: IDivisionDataDto) => setOverrideDivisionData(data)}>
                {effectiveTab === 'teams' && divisionDataToUse.season
                    ? (<DivisionTeams/>)
                    : null}
                {effectiveTab === 'fixtures' && divisionDataToUse.season
                    ? (<DivisionFixtures
                        setNewFixtures={propChanged(divisionDataToUse, setDivisionData, 'fixtures')}/>)
                    : null}
                {effectiveTab === 'players' && divisionDataToUse.season
                    ? (<DivisionPlayers/>)
                    : null}
                {effectiveTab === 'reports' && divisionDataToUse.season && account && account.access && account.access.runReports
                    ? (<DivisionReports/>)
                    : null}
                {effectiveTab === 'health' && divisionDataToUse.season && account && account.access && account.access.runHealthChecks
                    ? (<DivisionHealth/>)
                    : null}
                {effectiveTab && effectiveTab.startsWith('team:') && divisionDataToUse.season
                    ? (<TeamOverview teamId={getTeamId(effectiveTab.substring('team:'.length))}/>)
                    : null}
                {effectiveTab && effectiveTab.startsWith('player:') && divisionDataToUse.season
                    ? (<PlayerOverview playerId={getPlayerId(effectiveTab.substring('player:'.length))}/>)
                    : null}
            </DivisionDataContainer>)}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
