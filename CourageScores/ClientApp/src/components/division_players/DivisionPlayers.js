import React from 'react';
import {DivisionPlayer} from "./DivisionPlayer";

export function DivisionPlayers({ players, account, onPlayerSaved, seasonId, hideVenue, divisionId, hideHeading }) {
    return (<div className="light-background p-3 overflow-x-auto">
        <div>
            {hideHeading ? null : (<p>Only players that have played a singles match will appear here</p>)}
            <table className="table">
                <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    {hideVenue ? null :(<th>Venue</th>)}
                    <th>Won</th>
                    <th>Lost</th>
                    <th>Points</th>
                    <th>Win %</th>
                    <th>180s</th>
                    <th>hi-check</th>
                </tr>
                </thead>
                <tbody>
                {players.map(player => (<DivisionPlayer
                    key={player.id}
                    player={player}
                    account={account}
                    seasonId={seasonId}
                    onPlayerSaved={onPlayerSaved}
                    hideVenue={hideVenue}
                    divisionId={divisionId} />))}
                </tbody>
            </table>
        </div>
    </div>);
}
