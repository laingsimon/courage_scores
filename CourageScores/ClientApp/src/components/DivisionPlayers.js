import React from 'react';
import {useParams} from "react-router-dom";

export function DivisionPlayers(props) {
    const {divisionId} = useParams();
    const divisionData = props.divisionData[divisionId];

    if (!divisionData) {
        props.apis.reloadDivision(divisionId); // don't await the async?
        return (<div>Loading division data</div>);
    }

    if (!divisionData.players) {
        return (<div>No teams found</div>);
    }

    return (<div>
        <table className="table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Venue</th>
                    <th>Won</th>
                    <th>Lost</th>
                    <th>Points</th>
                    <th>Win %</th>
                    <th>180s</th>
                    <th>hi-check</th>
                </tr>
            </thead>
            <tbody>
            {divisionData.players.map(p => (<tr key={p.id}>
                <td>{p.rank}</td>
                <td>{p.name}</td>
                <td>{p.team}</td>
                <td>{p.won}</td>
                <td>{p.lost}</td>
                <td>{p.points}</td>
                <td>{p.winPc}</td>
                <td>{p.oneEighties}</td>
                <td>{p.over100checkouts}</td>
            </tr>))}
            </tbody>
        </table>
    </div>);
}
