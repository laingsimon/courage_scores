import React, { useEffect, useState } from 'react';
import {Link, useParams} from "react-router-dom";
import {NavItem, NavLink} from "reactstrap";
import {DivisionTeams} from "./division_teams/DivisionTeams";
import {DivisionFixtures} from "./division_fixtures/DivisionFixtures";
import {DivisionPlayers} from "./division_players/DivisionPlayers";
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {DivisionApi} from "../api/division";
import {TeamApi} from "../api/team";
import {DivisionControls} from "./DivisionControls";
import {DivisionReports} from "./division_reports/DivisionReports";
import {TeamOverview} from "./division_teams/TeamOverview";
import {PlayerOverview} from "./division_players/PlayerOverview";
import {Loading} from "./common/Loading";
import {PageError} from "./PageError";
import {propChanged} from "../Utilities";

export function Division({ account, apis, divisions }) {
    const { divisionId, mode, seasonId } = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const [ teams, setTeams ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);
    const effectiveTab = mode || 'teams';
    const divisionApi = new DivisionApi(new Http(new Settings()));
    const teamApi = new TeamApi(new Http(new Settings()));

    async function reloadDivisionData() {
        const divisionData = await divisionApi.data(divisionId, seasonId);
        setDivisionData(divisionData);

        const teams = await teamApi.getForDivisionAndSeason(divisionId, seasonId || divisionData.season.id);
        setTeams(teams);
        return divisionData;
    }

    useEffect(() => {
        if (loading || error) {
            return;
        }

        if (divisionData && divisionData.id === divisionId && (divisionData.season.id === seasonId || !seasonId)) {
            return;
        }

        setLoading(true);

        async function reloadDivisionData() {
            try {
                const divisionData = await divisionApi.data(divisionId, seasonId);
                const teams = await teamApi.getForDivisionAndSeason(divisionId, seasonId || divisionData.season.id);
                setDivisionData(divisionData);
                setTeams(teams);
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
            reloadAll={apis.reloadAll}
            seasons={divisionData.seasons}
            account={account}
            originalSeasonData={divisionData.season}
            originalDivisionData={{ name: divisionData.name, id: divisionData.id }}
            divisions={divisions}
            onReloadDivisionData={reloadDivisionData}
            onReloadSeasonData={reloadDivisionData}/>
        <ul className="nav nav-tabs">
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'teams' || effectiveTab.startsWith('team:') ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/teams`}>Teams</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'fixtures' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/fixtures`}>Fixtures</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'players' || effectiveTab.startsWith('player:') ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/players`}>Players</NavLink>
            </NavItem>
            {account && account.access && account.access.runReports ? (<NavItem>
                <NavLink tag={Link} className={effectiveTab === 'reports' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/reports`}>Reports</NavLink>
            </NavItem>) : null}
        </ul>
        {effectiveTab === 'teams'
            ? (<DivisionTeams
                teams={divisionData.teams}
                onTeamSaved={reloadDivisionData}
                account={account}
                seasonId={divisionData.season.id}
                divisions={divisions}
                divisionId={divisionId} />)
            : null}
        {effectiveTab === 'fixtures'
            ? (<DivisionFixtures
                season={divisionData.season}
                divisionId={divisionData.id}
                fixtures={divisionData.fixtures}
                teams={teams}
                allTeams={divisionData.allTeams}
                account={account}
                onReloadDivision={reloadDivisionData}
                setNewFixtures={propChanged(divisionData, setDivisionData, 'fixtures')}
                seasons={divisionData.seasons}
                divisions={divisions}
                allPlayers={divisionData.players} />)
            : null}
        {effectiveTab === 'players'
            ? (<DivisionPlayers
                players={divisionData.players}
                account={account}
                onPlayerSaved={reloadDivisionData}
                seasonId={divisionData.season.id}
                divisionId={divisionData.id} />)
            : null}
        {effectiveTab === 'reports'
            ? (<DivisionReports
                divisionData={divisionData} />)
            : null}
        {effectiveTab && effectiveTab.startsWith('team:')
            ? (<TeamOverview
                divisionData={divisionData}
                teamId={effectiveTab.substring('team:'.length)}
                account={account}
                seasonId={divisionData.season.id} />)
            : null}
        {effectiveTab && effectiveTab.startsWith('player:')
            ? (<PlayerOverview
                divisionData={divisionData}
                playerId={effectiveTab.substring('player:'.length)}
                account={account}
                seasonId={divisionData.season.id} />)
            : null}
    </div>);
}
