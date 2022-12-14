import React from 'react';
import {Link} from "react-router-dom";
import {DivisionPlayers} from "../division_players/DivisionPlayers";

export function TeamOverview({ divisionData, teamId, account, seasonId }) {
    /* position in table */
    /* players and link to their details */

    const today = new Date(new Date().toDateString());
    const team = divisionData.teams.filter(t => t.id === teamId)[0];
    const fixtures = divisionData.fixtures.map(fixtureDate => {
       return {
           date: fixtureDate.date,
           fixtures: fixtureDate.fixtures.filter(f => f.awayTeam && (f.awayTeam.id === teamId || f.homeTeam.id === teamId))
       };
    }).filter(fixtureDate => fixtureDate.fixtures.length > 0);
    const previousFixtures = fixtures.filter(fixtureDate => new Date(fixtureDate.date) < today);
    const lastFixture = previousFixtures.length > 0 ? previousFixtures[previousFixtures.length - 1] : null;
    const nextFixture = fixtures.filter(fixtureDate => new Date(fixtureDate.date) >= today)[0];
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

    function renderFixture(fixtureDate, titlePrefix) {
        const fixture = fixtureDate.fixtures[0];

        return (<div className="col text-center">
            <p><strong>{titlePrefix}: {new Date(fixtureDate.date).toDateString()}</strong></p>
            {fixture.homeTeam.id === teamId
                ? (<strong className="margin-right">{fixture.homeTeam.name}</strong>)
                : (<Link to={`/division/${divisionData.id}/team:${fixture.homeTeam.id}/${seasonId}`} className="margin-right">{fixture.homeTeam.name}</Link>)}
            <strong className="margin-right">
                {renderScore(fixture.homeScore, fixture.postponed)}
            </strong>
            <span className="margin-right">vs</span>
            <strong className="margin-right">
                {renderScore(fixture.awayScore, fixture.postponed)}
            </strong>
            {fixture.awayTeam.id === teamId
                ? (<strong className="margin-right">{fixture.awayTeam.name}</strong>)
                : (<Link to={`/division/${divisionData.id}/team:${fixture.awayTeam.id}/${seasonId}`} className="margin-right">{fixture.awayTeam.name}</Link>)}
        </div>);
    }

    return (<div className="light-background p-3">
        <h3>{team.name}</h3>
        <p>Address: {team.address}</p>

        <div>
            <div className="row justify-content-evenly">
                {lastFixture ? renderFixture(lastFixture, 'Last fixture') : null}
                {nextFixture ? renderFixture(nextFixture, 'Next fixture') : null}
            </div>
        </div>
        <div>
            <DivisionPlayers players={players} onPlayerSaved={null} account={account} seasonId={seasonId} hideVenue={true} divisionId={divisionData.id} />
        </div>
    </div>)
}
