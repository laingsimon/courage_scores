import React, {useState} from 'react';
import {EditTeamDetails} from "./EditTeamDetails";
import {Dialog} from "../common/Dialog";
import {Link} from "react-router-dom";
import {propChanged} from "../../Utilities";

export function DivisionTeam({team, account, divisionId, seasonId, onTeamSaved }) {
    const [ teamDetails, setTeamDetails ] = useState(Object.assign({ newDivisionId: divisionId }, team));
    const [ editTeam, setEditTeam ] = useState(false);
    const isAdmin = account && account.access && account.access.manageTeams;

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
                {...teamDetails}
                onCancel={() => setEditTeam(false)}
                onChange={propChanged(teamDetails, setTeamDetails)}
                onSaved={teamDetailSaved}
            />
        </Dialog>)
    }

    return (<tr>
        <td>
            {isAdmin ? (<button onClick={() => setEditTeam(true)} className="btn btn-sm btn-primary margin-right">✏️</button>) : null}
            <Link to={`/division/${divisionId}/team:${team.id}`}>{team.name}</Link>
            {editTeam && isAdmin ? renderEditTeam() : null}
        </td>
        <td>{team.played}</td>
        <td>{team.points}</td>
        <td>{team.fixturesWon}</td>
        <td>{team.fixturesLost}</td>
        <td>{team.fixturesDrawn}</td>
        <td>{team.difference}</td>
    </tr>);
}
