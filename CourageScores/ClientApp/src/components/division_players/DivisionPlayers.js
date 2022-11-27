import React from 'react';

export function DivisionPlayers({ players }) {
    return (<div className="light-background p-3">
        <div>
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
                {players.map(p => (<tr key={p.id}>
                    <td>{p.rank}</td>
                    <td>{p.captain ? (<span>🤴 </span>) : null}{p.name}</td>
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
        </div>
    </div>);
}
