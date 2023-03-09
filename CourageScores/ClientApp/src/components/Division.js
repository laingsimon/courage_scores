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
import {PageError} from "./PageError";
import {propChanged} from "../Utilities";
import {useDependencies} from "../IocContainer";
import {useApp} from "../AppContainer";
import {DivisionDataContainer} from "./DivisionDataContainer";

export function Division() {
    const { divisionApi, teamApi } = useDependencies();
    const { account } = useApp();
    const { divisionId, mode, seasonId } = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const [ teams, setTeams ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);
    const effectiveTab = mode || 'teams';

    async function reloadDivisionData() {
        const divisionData = await divisionApi.data(divisionId, seasonId);
        setDivisionData(divisionData);

        if (seasonId || divisionData.season) {
            const teams = await teamApi.getForDivisionAndSeason(divisionId, seasonId || divisionData.season.id);
            setTeams(teams);
        }
        return divisionData;
    }

    useEffect(() => {
        if (loading || error) {
            return;
        }

        if (divisionData && divisionData.id === divisionId && ((divisionData.season || {}).id === seasonId || !seasonId)) {
            return;
        }

        setLoading(true);

        async function reloadDivisionData() {
            try {
                const divisionData = await divisionApi.data(divisionId, seasonId);
                if (seasonId || divisionData.season) {
                    const teams = await teamApi.getForDivisionAndSeason(divisionId, seasonId || divisionData.season.id);
                    setTeams(teams);
                }
                setDivisionData(divisionData);
            } catch (e) {
                if (e.message.indexOf('Exception') !== -1) {
                    const dotnetException = JSON.parse(e.message);

                    setError({
                        message: dotnetException.Exception.Message,
                        stack: dotnetException.Exception.StackTrace ? dotnetException.Exception.StackTrace.join('\n') : null,
                        type: dotnetException.Exception.Type
                    });
                }
                else {
                    setError({
                        message: e.message,
                        stack: e.stack
                    });
                }
            }
            finally {
                setLoading(false);
            }
        }

        // noinspection JSIgnoredPromiseFromCall
        reloadDivisionData();
    },
    // eslint-disable-next-line
    [ divisionData, loading, divisionId, seasonId, error ]);

    if (error) {
        return (<PageError error={error} clearError={() => setError(null)} />)
    }

    if (loading || !divisionData) {
        return (<Loading />);
    }

    return (<div>
        <DivisionControls
            seasons={divisionData.seasons}
            originalSeasonData={divisionData.season}
            originalDivisionData={{ name: divisionData.name, id: divisionData.id }}
            onReloadDivisionData={reloadDivisionData}
            onReloadSeasonData={reloadDivisionData}/>
        <ul className="nav nav-tabs">
            <li className="nav-item">
                <NavLink tag={Link} className={effectiveTab === 'teams' || effectiveTab.startsWith('team:') ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/teams`}>Teams</NavLink>
            </li>
            <li className="nav-item">
                <NavLink tag={Link} className={effectiveTab === 'fixtures' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/fixtures`}>Fixtures</NavLink>
            </li>
            <li className="nav-item">
                <NavLink tag={Link} className={effectiveTab === 'players' || effectiveTab.startsWith('player:') ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/players`}>Players</NavLink>
            </li>
            {account && account.access && account.access.runReports ? (<li className="nav-item">
            <NavLink tag={Link} className={effectiveTab === 'reports' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/reports`}>Reports</NavLink>
            </li>) : null}
        </ul>
        <DivisionDataContainer {...divisionData}>
            {effectiveTab === 'teams' && divisionData.season
                ? (<DivisionTeams onTeamSaved={reloadDivisionData} />)
                : null}
            {effectiveTab === 'fixtures' && divisionData.season
                ? (<DivisionFixtures
                    onReloadDivision={reloadDivisionData}
                    setNewFixtures={propChanged(divisionData, setDivisionData, 'fixtures')} />)
                : null}
            {effectiveTab === 'players' && divisionData.season
                ? (<DivisionPlayers onPlayerSaved={reloadDivisionData} />)
                : null}
            {effectiveTab === 'reports'
                ? (<DivisionReports />)
                : null}
            {effectiveTab && effectiveTab.startsWith('team:') && divisionData.season
                ? (<TeamOverview teamId={effectiveTab.substring('team:'.length)} />)
                : null}
            {effectiveTab && effectiveTab.startsWith('player:') && divisionData.season
                ? (<PlayerOverview playerId={effectiveTab.substring('player:'.length)} />)
                : null}
        </DivisionDataContainer>
    </div>);
}
