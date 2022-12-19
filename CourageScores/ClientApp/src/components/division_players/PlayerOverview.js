import React from 'react';
import {Link} from "react-router-dom";
import {DivisionPlayers} from "./DivisionPlayers";

export function PlayerOverview({ divisionData, playerId, account, seasonId }) {
    const player = divisionData.players.filter(p => p.id === playerId)[0];
    const team = divisionData.teams.filter(t => t.id === player.teamId)[0];
    const knockoutDates = divisionData.fixtures.flatMap(fixtureDate => {
        const knockoutFixtures = fixtureDate.knockoutFixtures.filter(kf => kf.created);
        return knockoutFixtures
            .filter(kf => {
                return kf.sides.filter(side => {
                    return side.players.filter(p => p.id === playerId).length > 0;
                }).length > 0;
            })
            .map(kf => {
                return {
                    date: fixtureDate.date,
                    knockout: kf
                };
            });
    });

    function renderKnockoutGame(date) {
        return (<li key={date + '-' + date.knockout.address}>
            <Link to={`/knockout/${date.knockout.id}`}>
                {new Date(date.date).toDateString()} - {date.knockout.address}
            </Link>
        </li>);
    }

    return (<div className="light-background p-3">
        <h3>
            {player.name}
            <span className="h6 margin-left">
                <Link to={`/division/${divisionData.id}/team:${team.id}/${seasonId}`} className="margin-right">{team.name}</Link>
            </span>
        </h3>

        <div>
            <DivisionPlayers players={[ player ]} onPlayerSaved={null} account={account} seasonId={seasonId} divisionId={divisionData.id} />
        </div>

        <div>
            <h6>Knockout games</h6>
            <ul>
                {knockoutDates.map(renderKnockoutGame)}
            </ul>
        </div>
    </div>)
}