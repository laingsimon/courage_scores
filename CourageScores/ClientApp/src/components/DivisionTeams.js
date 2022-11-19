import React, { useState } from 'react';
import {EditTeamDetails} from "./EditTeamDetails";
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {TeamApi} from "../api/team";

export function DivisionTeams({ divisionData, onReloadDivision, account, divisionId }) {
    const [ editTeam, setEditTeam ] = useState(null);
    const [ loadingTeamDetails, setLoadingTeamDetails ] = useState(null);
    const isAdmin = account && account.access && account.access.manageTeams;

    async function prepareDeleteTeam(team) {
        if (loadingTeamDetails) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the ${team.name}?`)) {
            return;
        }

        const api = new TeamApi(new Http(new Settings()));
        const result = await api.delete(team.id);

        if (result.success) {
            await onReloadDivision();
        } else {
            console.log(result);
            window.alert(`Could not delete team: ${JSON.stringify(result)}`);
        }
    }

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

        await onReloadDivision();
        setEditTeam(result);
        setLoadingTeamDetails(null);
    }

    return (<div className="light-background p-3">
        <div className="overflow-auto max-scroll-height">
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
                        {(isAdmin) ? (<th></th>) : null}
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
                    {(isAdmin) ? (<td className="text-nowrap">
                        {(loadingTeamDetails === null && editTeam === null) || (editTeam != null && editTeam.id === t.id) || loadingTeamDetails === t.id ? (<button className={`btn btn-sm ${loadingTeamDetails === t.id || loadingTeamDetails === null ? 'btn-primary' : 'btn-secondary'}`} onClick={() => openEditTeam(t.id)}>
                            {loadingTeamDetails === t.id ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : '✏'}
                        </button>) : (<button className="btn btn-sm btn-light">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</button>)}
                        {(loadingTeamDetails === null && editTeam === null) || (editTeam != null && editTeam.id === t.id) || loadingTeamDetails === t.id ? (<button className="btn btn-sm" onClick={() => prepareDeleteTeam(t)}>❌</button>) : null}
                    </td>) : null}
                </tr>))}
                </tbody>
            </table>
        </div>
        {editTeam ? (<div className="mt-3"><EditTeamDetails {...editTeam}
                                      divisionId={divisionId}
                                      seasonId={divisionData.season.id}
                                      onChange={(name, value) => {
                                   const newData = {};
                                   newData[name] = value;
                                   setEditTeam(Object.assign({}, editTeam, newData))
                               } }
                                      onSaved={async () => { onReloadDivision(); setEditTeam(null); }}
                                           onCancel={() => setEditTeam(null)} /></div>) : null}
        {(isAdmin) && editTeam == null && loadingTeamDetails === null ? (<button className="btn btn-primary mt-3" onClick={() => setEditTeam({})}>
            Add team
        </button>) : null}
    </div>);
}
