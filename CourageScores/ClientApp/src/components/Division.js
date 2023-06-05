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

export function Division() {
    const { divisionApi } = useDependencies();
    const { account, onError, error } = useApp();
    const { divisionId, mode, seasonId } = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const effectiveTab = mode || 'teams';

    async function reloadDivisionData() {
        try {
            const divisionData = await divisionApi.data(divisionId, seasonId);
            setDivisionData(divisionData);
            return divisionData;
        } catch (e) {
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
            if (divisionData) {
                if (divisionData.id === divisionId && ((divisionData.season || {}).id === seasonId || !seasonId)) {
                    return;
                }

                if (divisionData.status) {
                    console.log(divisionData);
                    const suffix = divisionData.errors ? ' -- ' + Object.keys(divisionData.errors).map(key => `${key}: ${divisionData.errors[key]}`).join(', ') : '';
                    onError(`Error accessing division: Code: ${divisionData.status}${suffix}`);
                    return;
                }

                if (divisionData.dataErrors && any(divisionData.dataErrors)) {
                    onError(divisionData.dataErrors.join(', '));
                    return;
                }
            }
            setLoading(true);
            // noinspection JSIgnoredPromiseFromCall
            reloadDivisionData();
        } catch (e) {
            onError(e);
        }
    },
    // eslint-disable-next-line
    [ divisionData, loading, divisionId, seasonId, error ]);

    if (loading || !divisionData) {
        return (<Loading />);
    }

    try {
        return (<div>
            <DivisionControls
                originalSeasonData={divisionData.season}
                originalDivisionData={{name: divisionData.name, id: divisionData.id}}
                onDivisionOrSeasonChanged={reloadDivisionData} />
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <NavLink tag={Link}
                             className={effectiveTab === 'teams' ? ' text-dark active' : 'text-light'}
                             to={`/division/${divisionId}/teams${seasonId ? '/' + seasonId : ''}`}>Teams</NavLink>
                </li>
                {effectiveTab.startsWith('team:') ? (<li className="nav-item">
                    <NavLink tag={Link}
                             className="text-dark active"
                             to={`/division/${divisionId}/teams${seasonId ? '/' + seasonId : ''}`}>Team Details</NavLink>
                </li>) : null }
                <li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'fixtures' ? ' text-dark active' : 'text-light'}
                             to={`/division/${divisionId}/fixtures${seasonId ? '/' + seasonId : ''}`}>Fixtures</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink tag={Link}
                             className={effectiveTab === 'players' ? ' text-dark active' : 'text-light'}
                             to={`/division/${divisionId}/players${seasonId ? '/' + seasonId : ''}`}>Players</NavLink>
                </li>
                {effectiveTab.startsWith('player:') ? (<li className="nav-item">
                    <NavLink tag={Link}
                             className="text-dark active"
                             to={`/division/${divisionId}/teams${seasonId ? '/' + seasonId : ''}`}>Player Details</NavLink>
                </li>) : null }
                {account && account.access && account.access.runReports ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'reports' ? ' text-dark active' : 'text-light'}
                             to={`/division/${divisionId}/reports${seasonId ? '/' + seasonId : ''}`}>Reports</NavLink>
                </li>) : null}
                {divisionData.season ? (<li className="d-screen-none position-absolute right-0">
                    <strong className="mx-2 d-inline-block fs-3">{divisionData.name}, {divisionData.season.name}</strong>
                </li>) : null}
            </ul>
            <DivisionDataContainer {...divisionData} onReloadDivision={reloadDivisionData}>
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
                {effectiveTab === 'reports' && divisionData.season
                    ? (<DivisionReports/>)
                    : null}
                {effectiveTab && effectiveTab.startsWith('team:') && divisionData.season
                    ? (<TeamOverview teamId={effectiveTab.substring('team:'.length)}/>)
                    : null}
                {effectiveTab && effectiveTab.startsWith('player:') && divisionData.season
                    ? (<PlayerOverview playerId={effectiveTab.substring('player:'.length)}/>)
                    : null}
            </DivisionDataContainer>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
