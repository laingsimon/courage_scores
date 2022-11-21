import React from 'react';

export function DivisionTeams({ teams }) {
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
                {teams.map(t => (<tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.played}</td>
                    <td>{t.points}</td>
                    <td>{t.won}</td>
                    <td>{t.lost}</td>
                    <td>{t.drawn}</td>
                    <td>{t.difference}</td>
                </tr>))}
                </tbody>
            </table>
        </div>
    </div>);
}
