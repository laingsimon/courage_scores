import React from 'react';
import {Link} from "react-router-dom";
import {DivisionPlayers} from "../division_players/DivisionPlayers";
import {ShareButton} from "../ShareButton";
import {any} from "../../Utilities";
import {useDivisionData} from "../DivisionDataContainer";
import {useApp} from "../../AppContainer";

export function TeamOverview({ teamId }) {
    const { id: divisionId, teams, fixtures: divisionDataFixtures, players: divisionDataPlayers, season } = useDivisionData();
    const { teams: allTeams } = useApp();
    const team = allTeams.filter(t => t.id === teamId)[0] || { id: teamId };
    const fixtures = divisionDataFixtures.map(fixtureDate => {
       return {
           date: fixtureDate.date,
           fixtures: fixtureDate.fixtures.filter(f => f.awayTeam && (f.awayTeam.id === teamId || f.homeTeam.id === teamId))
       };
    }).filter(fixtureDate => any(fixtureDate.fixtures));
    const players = divisionDataPlayers.filter(p => p.teamId === teamId);

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

        return (<tr key={fixture.id}>
            <td>
                <div className="position-absolute">
                    <Link to={`/score/${fixture.id}`}>{new Date(fixtureDate.date).toDateString()}</Link>
                    {fixture.isKnockout ? (<span className="margin-left">(Qualifier)</span>) : null}
                </div>
            </td>
            <td className="text-end">
                <div className="mt-4">
                    {fixture.homeTeam.id === teamId
                        ? (<strong className="margin-right text-nowrap">{fixture.homeTeam.name}</strong>)
                        : (<Link to={`/division/${divisionId}/team:${fixture.homeTeam.id}/${season.id}`} className="margin-right text-nowrap">{fixture.homeTeam.name}</Link>)}
                </div>
            </td>
            <td className="align-middle">{renderScore(fixture.homeScore, fixture.postponed)}</td>
            <td className="align-middle">vs</td>
            <td className="align-middle">{renderScore(fixture.awayScore, fixture.postponed)}</td>
            <td>
                <div className="mt-4">
                    {fixture.awayTeam.id === teamId
                        ? (<strong className="margin-right text-nowrap">{fixture.awayTeam.name}</strong>)
                        : (<Link to={`/division/${divisionId}/team:${fixture.awayTeam.id}/${season.id}`} className="margin-right text-nowrap">{fixture.awayTeam.name}</Link>)}
                </div>
            </td>
        </tr>);
    }

    return (<div className="light-background p-3">
        <h3>{team.name} <ShareButton text={`Courage League: ${team.name}`} /></h3>
        <p>Address: {team.address}</p>

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
            <DivisionPlayers players={players} onPlayerSaved={null} hideVenue={true} />
        </div>
    </div>)
}
