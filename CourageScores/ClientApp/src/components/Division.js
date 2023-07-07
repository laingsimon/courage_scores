import React, { useEffect, useState } from 'react';
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

export function Division() {
    const { divisionApi } = useDependencies();
    const { account, onError, error, divisions, seasons } = useApp();
    const { divisionId: divisionIdish, mode, seasonId: seasonIdish } = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const effectiveTab = mode || 'teams';
    const [ dataErrors, setDataErrors ] = useState(null);
    const divisionId = getDivisionId(divisionIdish);
    const seasonId = getSeasonId(seasonIdish);

    function getDivisionId(idish) {
        if (isGuid(idish)) {
            return idish;
        }

        if (!divisions || !any(divisions)) {
            return null;
        }

        const division = divisions.filter(d => d.name.toLowerCase() === idish.toLowerCase())[0];
        return division ? division.id : null;
    }

    function getSeasonId(idish) {
        if (isGuid(idish)) {
            return idish;
        }

        if (!seasons || !any(seasons) || !idish) {
            return null;
        }

        const season = seasons.filter(d => d.name.toLowerCase() === idish.toLowerCase())[0];
        return season ? season.id : null;
    }

    function getPlayerId(idish) {
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

        const team = divisionData.teams.filter(t => t.name.toLowerCase() === teamName.toLowerCase())[0];
        if (!team) {
            // team not found
            return idish;
        }

        const teamPlayer = divisionData.players.filter(p => p.teamId === team.id && p.name.toLowerCase() === playerName.toLowerCase())[0];
        return teamPlayer ? teamPlayer.id : null;
    }

    function getTeamId(idish) {
        if (isGuid(idish)) {
            return idish;
        }

        if (!divisionData || !idish) {
            return null;
        }

        const team = divisionData.teams.filter(t => t.name.toLowerCase() === idish.toLowerCase())[0];
        return team ? team.id : null;
    }

    async function reloadDivisionData() {
        try {
            const divisionData = await divisionApi.data(divisionId, seasonId);
            setDataErrors(null);
            setDivisionData(divisionData);
            return divisionData;
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (loading || error) {
            return;
        }

        try {
            if (!divisionData || ((divisionData.id !== divisionId || ((divisionData.season || {}).id !== seasonId && seasonId)) && !divisionData.status)) {
                if (divisionId) {
                    setLoading(true);
                    // noinspection JSIgnoredPromiseFromCall
                    reloadDivisionData();
                }
                return;
            }

            if (divisionData.status) {
                /* istanbul ignore next */
                console.log(divisionData);
                const suffix = divisionData.errors ? ' -- ' + Object.keys(divisionData.errors).map(key => `${key}: ${divisionData.errors[key]}`).join(', ') : '';
                onError(`Error accessing division: Code: ${divisionData.status}${suffix}`);
                return;
            }

            if (any(divisionData.dataErrors || [])) {
                setDataErrors(divisionData.dataErrors);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    },
    // eslint-disable-next-line
    [ divisionData, loading, divisionId, seasonId, error ]);

    if (loading) {
        return (<Loading />);
    }

    if (loading || !divisionData) {
        return (<div className="p-3 content-background">
            No data found
        </div>);
    }

    try {
        return (<div>
            <DivisionControls
                originalSeasonData={divisionData.season}
                originalDivisionData={{name: divisionData.name, id: divisionData.id, updated: divisionData.updated}}
                onDivisionOrSeasonChanged={reloadDivisionData} />
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <NavLink tag={Link}
                             className={effectiveTab === 'teams' ? 'active' : ''}
                             to={`/division/${divisionIdish}/teams${seasonIdish ? '/' + seasonIdish : ''}`}>Teams</NavLink>
                </li>
                {effectiveTab.startsWith('team:') ? (<li className="nav-item">
                    <NavLink tag={Link}
                             className="active"
                             to={`/division/${divisionIdish}/teams${seasonIdish ? '/' + seasonIdish : ''}`}>Team Details</NavLink>
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
                             to={`/division/${divisionIdish}/teams${seasonIdish ? '/' + seasonIdish : ''}`}>Player Details</NavLink>
                </li>) : null}
                {account && account.access && account.access.runReports ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'reports' ? 'active' : ''}
                             to={`/division/${divisionIdish}/reports${seasonIdish ? '/' + seasonIdish : ''}`}>Reports</NavLink>
                </li>) : null}
                {divisionData.season ? (<li className="d-screen-none position-absolute right-0">
                    <strong className="mx-2 d-inline-block fs-3">{divisionData.name}, {divisionData.season.name}</strong>
                </li>) : null}
            </ul>
            {dataErrors && account ? (<div className="content-background p-3">
                <h3>⚠ Errors in division data</h3>
                <ol>
                    {dataErrors.map((error, index) => {
                        return (<li key={index}>{error}</li>);
                    })}
                </ol>
                <button className="btn btn-primary" onClick={() => setDataErrors(null)}>Hide errors</button>
            </div>) : (<DivisionDataContainer {...divisionData} onReloadDivision={reloadDivisionData}>
                {effectiveTab === 'teams' && divisionData.season
                    ? (<DivisionTeams/>)
                    : null}
                {effectiveTab === 'fixtures' && divisionData.season
                    ? (<DivisionFixtures
                        setNewFixtures={propChanged(divisionData, setDivisionData, 'fixtures')}/>)
                    : null}
                {effectiveTab === 'players' && divisionData.season
                    ? (<DivisionPlayers/>)
                    : null}
                {effectiveTab === 'reports' && divisionData.season && account && account.access && account.access.runReports
                    ? (<DivisionReports/>)
                    : null}
                {effectiveTab && effectiveTab.startsWith('team:') && divisionData.season
                    ? (<TeamOverview teamId={getTeamId(effectiveTab.substring('team:'.length))}/>)
                    : null}
                {effectiveTab && effectiveTab.startsWith('player:') && divisionData.season
                    ? (<PlayerOverview playerId={getPlayerId(effectiveTab.substring('player:'.length))}/>)
                    : null}
            </DivisionDataContainer>)}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
