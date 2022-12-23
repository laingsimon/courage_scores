import React from 'react';
import {Link} from "react-router-dom";
import {DivisionPlayers} from "../division_players/DivisionPlayers";

export function TeamOverview({ divisionData, teamId, account, seasonId }) {
    const team = divisionData.teams.filter(t => t.id === teamId)[0];
    const fixtures = divisionData.fixtures.map(fixtureDate => {
       return {
           date: fixtureDate.date,
           fixtures: fixtureDate.fixtures.filter(f => f.awayTeam && (f.awayTeam.id === teamId || f.homeTeam.id === teamId))
       };
    }).filter(fixtureDate => fixtureDate.fixtures.length > 0);
    const players = divisionData.players.filter(p => p.teamId === teamId);

    function renderScore(score, postponed) {
        if (postponed) {
            return 'P';
        }

        if (score === null) {
            return '-';
        }

        return score;
    }

    function renderFixtureAndDate(fixtureDate) {
        const fixture = fixtureDate.fixtures[0];

        return (<tr>
            <td>
                <Link to={`/score/${fixture.id}`}>{new Date(fixtureDate.date).toDateString()}</Link>
                {fixture.isKnockout ? (<span className="margin-left">(Knockout)</span>) : null}
            </td>
            <td className="text-end">
                {fixture.homeTeam.id === teamId
                    ? (<strong className="margin-right text-nowrap">{fixture.homeTeam.name}</strong>)
                    : (<Link to={`/division/${divisionData.id}/team:${fixture.homeTeam.id}/${seasonId}`} className="margin-right">{fixture.homeTeam.name}</Link>)}
            </td>
            <td> {renderScore(fixture.homeScore, fixture.postponed)}</td>
            <td>vs</td>
            <td>{renderScore(fixture.awayScore, fixture.postponed)}</td>
            <td>
                {fixture.awayTeam.id === teamId
                    ? (<strong className="margin-right text-nowrap">{fixture.awayTeam.name}</strong>)
                    : (<Link to={`/division/${divisionData.id}/team:${fixture.awayTeam.id}/${seasonId}`} className="margin-right">{fixture.awayTeam.name}</Link>)}
            </td>
        </tr>);
    }

    return (<div className="light-background p-3">
        <h3>{team.name}</h3>
        <p>Address: {team.address}</p>

        <table className="table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th className="text-end">Home</th>
                    <th className="narrow-column"></th>
                    <th className="narrow-column">vs</th>
                    <th className="narrow-column"></th>
                    <th>Away</th>
                </tr>
            </thead>
            <tbody>
            {fixtures.map(renderFixtureAndDate)}
            </tbody>
        </table>
        <div className="overflow-x-auto">
            <DivisionPlayers players={players} onPlayerSaved={null} account={account} seasonId={seasonId} hideVenue={true} divisionId={divisionData.id} />
        </div>
    </div>)
}
