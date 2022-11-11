import React, { useState } from 'react';
import {EditTeamDetails} from "./EditTeamDetails";
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {TeamApi} from "../api/team";

export function DivisionTeams(props) {
    const divisionData = props.divisionData;
    const [ editTeam, setEditTeam ] = useState(null);
    const [ loadingTeamDetails, setLoadingTeamDetails ] = useState(null);

    async function openEditTeam(id) {
        if (loadingTeamDetails) {
            return;
        }

        if (editTeam != null && editTeam.id === id) {
            setEditTeam(null);
            return;
        }

        const api = new TeamApi(new Http(new Settings()));
        setLoadingTeamDetails(id);
        const result = await api.get(id);

        setEditTeam(result);
        setLoadingTeamDetails(null);
    }

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
                    {(props.account && props.account.access && props.account.access.teamAdmin) ? (<th></th>) : null}
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
                {(props.account && props.account.access && props.account.access.teamAdmin) ? (<td>
                    {(loadingTeamDetails === null && editTeam === null) || (editTeam != null && editTeam.id === t.id) || loadingTeamDetails === t.id ? (<button className={`btn btn-sm ${loadingTeamDetails === t.id || loadingTeamDetails === null ? 'btn-primary' : 'btn-secondary'}`} onClick={() => openEditTeam(t.id)}>
                        {loadingTeamDetails === t.id ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : '✏'}
                    </button>) : (<button className="btn btn-sm btn-light">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</button>)}
                </td>) : null}
            </tr>))}
            </tbody>
        </table>
        {editTeam ? (<EditTeamDetails {...editTeam}
                                      divisionId={props.divisionId}
                                      onChange={(name, value) => {
                                   const newData = {};
                                   newData[name] = value;
                                   setEditTeam(Object.assign({}, editTeam, newData))
                               } }
                                      onSaved={async () => { props.onReloadDivision(); setEditTeam(null); }}
                                      onCancel={() => setEditTeam(null)} />) : null}
        {(props.account && props.account.access && props.account.access.teamAdmin) && editTeam == null && loadingTeamDetails === null ? (<button className="btn btn-primary" onClick={() => setEditTeam({})}>
            Add team
        </button>) : null}
    </div>);
}
