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
import {propChanged} from "../Utilities";
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
            if (e.message.indexOf('Exception') !== -1) {
                const dotnetException = JSON.parse(e.message);

                onError({
                    message: dotnetException.Exception.Message,
                    stack: dotnetException.Exception.StackTrace ? dotnetException.Exception.StackTrace.join('\n') : null,
                    type: dotnetException.Exception.Type
                });
            }
            else {
                onError({
                    message: e.message,
                    stack: e.stack
                });
            }
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (loading || error) {
            return;
        }

        if (divisionData && divisionData.id === divisionId && ((divisionData.season || {}).id === seasonId || !seasonId)) {
            return;
        }

        setLoading(true);
        // noinspection JSIgnoredPromiseFromCall
        reloadDivisionData();
    },
    // eslint-disable-next-line
    [ divisionData, loading, divisionId, seasonId, error ]);

    if (loading || !divisionData) {
        return (<Loading />);
    }

    try {
        return (<div>
            <DivisionControls
                seasons={divisionData.seasons}
                originalSeasonData={divisionData.season}
                originalDivisionData={{name: divisionData.name, id: divisionData.id}}
                onDivisionOrSeasonChanged={reloadDivisionData} />
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <NavLink tag={Link}
                             className={effectiveTab === 'teams' || effectiveTab.startsWith('team:') ? ' text-dark active' : 'text-light'}
                             to={`/division/${divisionId}/teams`}>Teams</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'fixtures' ? ' text-dark active' : 'text-light'}
                             to={`/division/${divisionId}/fixtures`}>Fixtures</NavLink>
                </li>
                <li className="nav-item">
                    <NavLink tag={Link}
                             className={effectiveTab === 'players' || effectiveTab.startsWith('player:') ? ' text-dark active' : 'text-light'}
                             to={`/division/${divisionId}/players`}>Players</NavLink>
                </li>
                {account && account.access && account.access.runReports ? (<li className="nav-item">
                    <NavLink tag={Link} className={effectiveTab === 'reports' ? ' text-dark active' : 'text-light'}
                             to={`/division/${divisionId}/reports`}>Reports</NavLink>
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
        onError(e);
    }
}
