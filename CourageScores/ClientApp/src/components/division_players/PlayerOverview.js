import React from 'react';
import {Link} from "react-router-dom";
import {DivisionPlayers} from "./DivisionPlayers";

export function PlayerOverview({ divisionData, playerId, account, seasonId }) {
    const player = divisionData.players.filter(p => p.id === playerId)[0] || { id: null, name: 'Unknown', fixtures: {} };
    const team = divisionData.teams.filter(t => t.id === player.teamId)[0] || { id: null, name: 'Unknown' };
    const fixtures = divisionData.fixtures.map(fixtureDate => {
        const fixtureId = player.fixtures[fixtureDate.date];
        const tournamentFixtures = fixtureDate.tournamentFixtures
            .filter(tournament => !tournament.proposed)
            .filter(tournament => {
                return tournament.players.filter(id => id === playerId).length > 0;
            });

        return {
            date: fixtureDate.date,
            fixtures: fixtureId ? fixtureDate.fixtures.filter(f => f.id === fixtureId) : [],
            tournamentFixtures: tournamentFixtures
        };
    }).filter(d => d.fixtures.length > 0 || d.tournamentFixtures.length > 0);

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
        const tournamentFixture = fixtureDate.tournamentFixtures[0];

        return fixture
            ? renderNormalFixture(fixture, fixtureDate.date)
            : renderTournamentFixture(tournamentFixture, fixtureDate.date);
    }

    function renderNormalFixture(fixture, date) {
        return (<tr key={fixture.id}>
            <td>
                <Link to={`/score/${fixture.id}`}>{new Date(date).toDateString()}</Link>
                {fixture.isKnockout ? (<span className="margin-left">(Knockout)</span>) : null}
            </td>
            <td className="text-end">
                {fixture.homeTeam.id === team.id
                    ? (<strong className="margin-right text-nowrap">{fixture.homeTeam.name}</strong>)
                    : (<Link to={`/division/${divisionData.id}/team:${fixture.homeTeam.id}/${seasonId}`} className="margin-right">{fixture.homeTeam.name}</Link>)}
            </td>
            <td> {renderScore(fixture.homeScore, fixture.postponed)}</td>
            <td>vs</td>
            <td>{renderScore(fixture.awayScore, fixture.postponed)}</td>
            <td>
                {fixture.awayTeam.id === team.id
                    ? (<strong className="margin-right text-nowrap">{fixture.awayTeam.name}</strong>)
                    : (<Link to={`/division/${divisionData.id}/team:${fixture.awayTeam.id}/${seasonId}`} className="margin-right">{fixture.awayTeam.name}</Link>)}
            </td>
        </tr>);
    }

    function renderTournamentFixture(tournament, date) {
        return (<tr key={tournament.id}>
            <td>
                <Link to={`/tournament/${tournament.id}`}>{new Date(date).toDateString()}</Link>
            </td>
            <td className="text-end">
                <Link to={`/tournament/${tournament.id}`}>
                    {tournament.type} at <strong>{tournament.address}</strong>
                </Link>
            </td>
            <td colSpan="2"></td>
            <td colSpan="2">
                {tournament.winningSide ? (<td colSpan="2">
                    {tournament.winningSide
                        ? (<span className="margin-left">Winner: <strong className="text-primary">{tournament.winningSide.name}</strong></span>)
                        : null}
                </td>) : null}
            </td>
        </tr>);
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
            <DivisionPlayers hideHeading={true} hideVenue={true} players={[ player ]} onPlayerSaved={null} account={account} seasonId={seasonId} divisionId={divisionData.id} />
        </div>
    </div>)
}
