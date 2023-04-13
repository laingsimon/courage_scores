import React from 'react';
import {DivisionPlayer} from "./DivisionPlayer";
import {useDivisionData} from "../DivisionDataContainer";

export function DivisionPlayers({ hideVenue, hideHeading, players }) {
    const { players: divisionDataPlayers } = useDivisionData();
    const playersToShow = players || divisionDataPlayers;

    return (<div className="light-background p-3 overflow-x-auto">
        <div>
            {hideHeading ? null : (<p className="d-print-none">Only players that have played a singles match will appear here</p>)}
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
                {playersToShow.map(player => (<DivisionPlayer
                    key={player.id}
                    player={player}
                    hideVenue={hideVenue} />))}
                </tbody>
            </table>
        </div>
    </div>);
}
