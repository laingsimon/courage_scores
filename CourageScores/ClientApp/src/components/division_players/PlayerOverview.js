import React from 'react';
import {Link} from "react-router-dom";
import {DivisionPlayers} from "./DivisionPlayers";

export function PlayerOverview({ divisionData, playerId, account, seasonId }) {
    const player = divisionData.players.filter(p => p.id === playerId)[0] || { id: null, name: 'Unknown' };
    const team = divisionData.teams.filter(t => t.id === player.teamId)[0] || { id: null, name: 'Unknown' };
    const tournamentDates = divisionData.fixtures.flatMap(fixtureDate => {
        const tournamentFixtures = fixtureDate.tournamentFixtures.filter(tournament => tournament.created);
        return tournamentFixtures
            .filter(tournament => {
                return tournament.sides.filter(side => {
                    return side.players.filter(p => p.id === playerId).length > 0;
                }).length > 0;
            })
            .map(tournament => {
                return {
                    date: fixtureDate.date,
                    tournament: tournament
                };
            });
    });

    function renderTournamentGame(date) {
        return (<li key={date + '-' + date.tournament.address}>
            <Link to={`/tournament/${date.tournament.id}`}>
                {new Date(date.date).toDateString()} - {date.tournament.address}
            </Link>
        </li>);
    }

    if (!player.id) {
        return (<div className="light-background p-3">
            <h5 className="text-danger">⚠ Player could not be found</h5>
        </div>)
    }

    return (<div className="light-background p-3">
        <h3>
            {player.name}
            <span className="h6 margin-left">
                <Link to={`/division/${divisionData.id}/team:${team.id}/${seasonId}`} className="margin-right">{team.name}</Link>
            </span>
        </h3>

        <div className="overflow-x-auto">
            <DivisionPlayers hideHeading={true} hideVenue={true} players={[ player ]} onPlayerSaved={null} account={account} seasonId={seasonId} divisionId={divisionData.id} />
        </div>

        <div>
            <h6>Tournament games</h6>
            <ul>
                {tournamentDates.map(renderTournamentGame)}
            </ul>
        </div>
    </div>)
}
