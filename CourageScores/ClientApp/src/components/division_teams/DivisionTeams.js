import React from 'react';
import {DivisionTeam} from "./DivisionTeam";

export function DivisionTeams({ teams, account, divisionId, seasonId, onTeamSaved }) {
    return (<div className="light-background p-3">
        <div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Venue</th>
                        <th>Played</th>
                        <th>Points</th>
                        <th>Won</th>
                        <th>Lost</th>
                        <th>Drawn</th>
                        <th>+/-</th>
                    </tr>
                </thead>
                <tbody>
                {teams.map(team => (<DivisionTeam
                    key={team.id}
                    team={team}
                    seasonId={seasonId}
                    account={account}
                    divisionId={divisionId}
                    onTeamSaved={onTeamSaved} />))}
                </tbody>
            </table>
        </div>
    </div>);
}
