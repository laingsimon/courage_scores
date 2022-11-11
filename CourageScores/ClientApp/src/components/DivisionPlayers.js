import React from 'react';

export function DivisionPlayers(props) {
    const divisionData = props.divisionData;

    return (<div className="light-background p-3">
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
                <td>{p.winPercentage}</td>
                <td>{p.oneEighties}</td>
                <td>{p.over100Checkouts}</td>
            </tr>))}
            </tbody>
        </table>
    </div>);
}
