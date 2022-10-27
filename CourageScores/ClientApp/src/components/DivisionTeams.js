import React from 'react';
import {useParams} from "react-router-dom";

export function DivisionTeams(props) {
    const {divisionId} = useParams();
    const divisionData = props.divisionData[divisionId];

    if (!divisionData) {
        props.apis.reloadDivision(divisionId); // don't await the async?
        return (<div>Loading division data</div>);
    }

    return (<div>
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
            {divisionData.teams.map(t => (<tr>
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
    </div>);
}
