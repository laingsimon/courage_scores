import React from 'react';
import {DivisionPlayer} from "./DivisionPlayer";
import {useDivisionData} from "../DivisionDataContainer";
import {sortBy} from "../../helpers/collections";
import {useApp} from "../../AppContainer";

export function DivisionPlayers({ hideVenue, hideHeading, players }) {
    const { account } = useApp();
    const isAdmin = account && account.access && account.access.managePlayers;
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
                {playersToShow
                    .filter(p => isAdmin || p.singles.matchesPlayed > 0)
                    .sort(sortBy('rank'))
                    .map(player => (<DivisionPlayer
                        key={player.id}
                        player={player}
                        hideVenue={hideVenue} />))}
                </tbody>
            </table>
        </div>
    </div>);
}
