import React from 'react';
import {DivisionPlayer} from "./DivisionPlayer";
import {useDivisionData} from "../DivisionDataContainer";

export function DivisionPlayers({ onPlayerSaved, hideVenue, hideHeading }) {
    const { players } = useDivisionData();

    return (<div className="light-background p-3 overflow-x-auto">
        <div>
            {hideHeading ? null : (<p>Only players that have played a singles match will appear here</p>)}
            <table className="table">
                <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    {hideVenue ? null :(<th>Venue</th>)}
                    <th>Played</th>
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
                    onPlayerSaved={onPlayerSaved}
                    hideVenue={hideVenue} />))}
                </tbody>
            </table>
        </div>
    </div>);
}
