import React from 'react';
import {Link} from "react-router-dom";
import {DivisionPlayers} from "./DivisionPlayers";
import {ShareButton} from "../common/ShareButton";
import {any} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {useDivisionData} from "../DivisionDataContainer";
import {useBranding} from "../../BrandingContainer";

export function PlayerOverview({ playerId }) {
    const { name } = useBranding();
    const { players, teams, fixtures: divisionDataFixtures, id: divisionId, season } = useDivisionData();
    const player = players.filter(p => p.id === playerId)[0] || { id: null, name: 'Unknown', fixtures: {} };
    const team = teams.filter(t => t.id === player.teamId)[0] || { id: null, name: 'Unknown' };
    const fixtures = divisionDataFixtures.map(fixtureDate => {
        const fixtureId = player.fixtures[fixtureDate.date];
        const tournamentFixtures = fixtureDate.tournamentFixtures
            .filter(tournament => !tournament.proposed)
            .filter(tournament => {
                return any(tournament.players, id => id === playerId);
            });

        return {
            date: fixtureDate.date,
            fixtures: fixtureId ? fixtureDate.fixtures.filter(f => f.id === fixtureId) : [],
            tournamentFixtures: tournamentFixtures
        };
    }).filter(d => any(d.fixtures) || any(d.tournamentFixtures));

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
            ? renderLeagueFixture(fixture, fixtureDate.date)
            : renderTournamentFixture(tournamentFixture, fixtureDate.date);
    }

    function renderLeagueFixture(fixture, date) {
        return (<tr key={fixture.id}>
            <td>
                <div className="position-absolute">
                    <Link to={`/score/${fixture.id}`}>{renderDate(date)}</Link>
                    {fixture.isKnockout ? (<span className="margin-left">(Qualifier)</span>) : null}
                </div>
            </td>
            <td className="text-end">
                <div className="mt-4">
                {fixture.homeTeam.id === team.id
                    ? (<strong className="margin-right text-nowrap">{fixture.homeTeam.name}</strong>)
                    : (<Link to={`/division/${divisionId}/team:${fixture.homeTeam.id}/${season.id}`} className="margin-right">{fixture.homeTeam.name}</Link>)}
                </div>
            </td>
            <td className="align-middle">{renderScore(fixture.homeScore, fixture.postponed)}</td>
            <td className="align-middle">vs</td>
            <td className="align-middle">{renderScore(fixture.awayScore, fixture.postponed)}</td>
            <td>
                <div className="mt-4">
                {fixture.awayTeam.id === team.id
                    ? (<strong className="margin-right text-nowrap">{fixture.awayTeam.name}</strong>)
                    : (<Link to={`/division/${divisionId}/team:${fixture.awayTeam.id}/${season.id}`} className="margin-right">{fixture.awayTeam.name}</Link>)}
                </div>
            </td>
        </tr>);
    }

    function renderTournamentFixture(tournament, date) {
        return (<tr key={tournament.id}>
            <td>
                <div className="position-absolute">
                    <Link to={`/tournament/${tournament.id}`}>{renderDate(date)}</Link>
                </div>
            </td>
            <td className="text-end" colSpan="3">
                <div className="mt-4">
                    <Link to={`/tournament/${tournament.id}`} className="text-nowrap">
                        {tournament.type} at <strong>{tournament.address}</strong>
                    </Link>
                </div>
            </td>
            <td colSpan="2">
                {tournament.winningSide ? (<div className="mt-4">
                    {tournament.winningSide
                        ? (<span className="margin-left">Winner: <strong className="text-primary">{tournament.winningSide.name}</strong></span>)
                        : null}
                </div>) : null}
            </td>
        </tr>);
    }

    if (!player.id) {
        return (<div className="content-background p-3">
            <h5 className="text-danger">⚠ Player could not be found</h5>
        </div>)
    }

    return (<div className="content-background p-3">
        <h3>
            {player.name}
            <span className="h6 margin-left">
                <Link to={`/division/${divisionId}/team:${team.id}/${season.id}`} className="margin-right">{team.name}</Link>
            </span>
            <span className="margin-left">
                <ShareButton text={`${name}: ${player.name}`} />
            </span>
        </h3>

        <div className="overflow-x-auto">
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
        </div>

        <div className="overflow-x-auto">
            <DivisionPlayers hideHeading={true} hideVenue={true} players={[ player ]} onPlayerSaved={null} />
        </div>
    </div>)
}
