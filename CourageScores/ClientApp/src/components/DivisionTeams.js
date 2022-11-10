import React, { useState } from 'react';
import {useParams} from "react-router-dom";
import {EditTeam} from "./EditTeam";

export function DivisionTeams(props) {
    const {divisionId} = useParams();
    const divisionData = props.divisionData[divisionId];
    const [ editTeam, setEditTeam ] = useState(null);

    return (<div className="light-background p-3">
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
            {divisionData.teams.map(t => (<tr key={t.id}>
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
        {editTeam ? (<EditTeam {...editTeam} divisionId={divisionId} onChange={async () => { await props.apis.reloadDivision(divisionId); setEditTeam(null); }} onCancel={() => setEditTeam(null)} />) : null}
        {editTeam && (props.account && props.account.access && props.account.access.teamAdmin) ? null : (<button className="btn btn-primary" onClick={() => setEditTeam({})}>
            Add team
        </button>)}
    </div>);
}
