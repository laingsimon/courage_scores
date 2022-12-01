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

export function Division({ account, apis }) {
    const { divisionId, mode, seasonId } = useParams();
    const [ divisionData, setDivisionData ] = useState(null);
    const [ teams, setTeams ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const effectiveTab = mode || 'teams';
    const divisionApi = new DivisionApi(new Http(new Settings()));
    const teamApi = new TeamApi(new Http(new Settings()));

    async function reloadDivisionData() {
        const divisionData = await divisionApi.data(divisionId, seasonId);
        setDivisionData(divisionData);

        const teams = await teamApi.getForDivisionAndSeason(divisionId, seasonId || divisionData.season.id);
        setTeams(teams);
    }

    useEffect(() => {
        if (loading) {
            return;
        }

        if (divisionData && divisionData.id === divisionId && (divisionData.season.id === seasonId || !seasonId)) {
            return;
        }

        setLoading(true);

        async function reloadDivisionData() {
            const divisionData = await divisionApi.data(divisionId, seasonId);
            const teams = await teamApi.getForDivisionAndSeason(divisionId, seasonId || divisionData.season.id);
            setDivisionData(divisionData);
            setTeams(teams);
            setLoading(false);
        }

        // noinspection JSIgnoredPromiseFromCall
        reloadDivisionData();
    },
    // eslint-disable-next-line
    [ divisionData, loading, divisionId, seasonId ]);

    if (loading || !divisionData) {
        return (<div className="light-background p-3 loading-background">
            <div className="mt-2 pt-4 h3">Loading...</div>
        </div>);
    }

    return (<div>
        <DivisionControls
            reloadAll={apis.reloadAll}
            seasons={divisionData.seasons}
            account={account}
            originalSeasonData={{
                id: divisionData.season.id,
                name: divisionData.season.name,
                startDate: divisionData.season.startDate.substring(0, 10),
                endDate: divisionData.season.endDate.substring(0, 10),
            }}
            originalDivisionName={divisionData.name}
            onReloadDivisionData={reloadDivisionData} />
        <ul className="nav nav-tabs">
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'teams' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/teams`}>Teams</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'fixtures' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/fixtures`}>Fixtures</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className={effectiveTab === 'players' ? ' text-dark active' : 'text-light'} to={`/division/${divisionId}/players`}>Players</NavLink>
            </NavItem>
        </ul>
        {effectiveTab === 'teams'
            ? (<DivisionTeams
                teams={divisionData.teams}
                teamsWithoutFixtures={divisionData.teamsWithoutFixtures}
                onTeamSaved={reloadDivisionData}
                account={account}
                seasonId={divisionData.season.id}
                divisionId={divisionId} />)
            : null}
        {effectiveTab === 'fixtures'
            ? (<DivisionFixtures
                season={divisionData.season}
                divisionId={divisionData.id}
                fixtures={divisionData.fixtures}
                teams={teams}
                account={account}
                onNewTeam={reloadDivisionData}
                onReloadDivision={reloadDivisionData} />)
            : null}
        {effectiveTab === 'players'
            ? (<DivisionPlayers
                players={divisionData.players}
                account={account}
                onPlayerSaved={reloadDivisionData}
                seasonId={divisionData.season.id} />)
            : null}
    </div>);
}
