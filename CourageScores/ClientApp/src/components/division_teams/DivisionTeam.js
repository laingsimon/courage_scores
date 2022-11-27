import React, {useState} from 'react';
import {EditTeamDetails} from "./EditTeamDetails";
import {Dialog} from "../common/Dialog";

export function DivisionTeam({team, account, divisionId, seasonId, onTeamSaved }) {
    const [ teamDetails, setTeamDetails ] = useState(Object.assign({}, team));
    const [ editTeam, setEditTeam ] = useState(false);
    const isAdmin = account && account.access && account.access.manageTeams;

    function teamDetailChanged(prop, value) {
        const newDetails = Object.assign({}, teamDetails);
        newDetails[prop] = value;
        setTeamDetails(newDetails);
    }

    async function teamDetailSaved() {
        if (onTeamSaved) {
            await onTeamSaved();
        }

        setEditTeam(false);
    }

    function renderEditTeam() {
        return (<Dialog title={`Edit team: ${team.name}`}>
            <EditTeamDetails
                id={teamDetails.id}
                divisionId={divisionId}
                seasonId={seasonId}
                name={teamDetails.name}
                address={teamDetails.address}
                onCancel={() => setEditTeam(false)}
                onChange={teamDetailChanged}
                onSaved={teamDetailSaved}
            />
        </Dialog>)
    }

    return (<tr key={team.id}>
        <td>
            {isAdmin ? (<button onClick={() => setEditTeam(true)} className="btn btn-sm btn-primary margin-right">✏️</button>) : null}
            {editTeam && isAdmin ? renderEditTeam() : null}
            {team.name}
        </td>
        <td>{team.played}</td>
        <td>{team.points}</td>
        <td>{team.won}</td>
        <td>{team.lost}</td>
        <td>{team.drawn}</td>
        <td>{team.difference}</td>
    </tr>);
}
