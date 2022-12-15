import React from 'react';
import {Link} from "react-router-dom";
import {DivisionPlayers} from "./DivisionPlayers";

export function PlayerOverview({ divisionData, playerId, account, seasonId }) {
    const player = divisionData.players.filter(p => p.id === playerId)[0];
    const team = divisionData.teams.filter(t => t.id === player.teamId)[0];

    return (<div className="light-background p-3">
        <h3>{player.name}</h3>
        <p>
            <Link to={`/division/${divisionData.id}/team:${team.id}/${seasonId}`} className="margin-right">{team.name}</Link>
        </p>

        <div>
            <DivisionPlayers players={[ player ]} onPlayerSaved={null} account={account} seasonId={seasonId} divisionId={divisionData.id} />
        </div>
    </div>)
}