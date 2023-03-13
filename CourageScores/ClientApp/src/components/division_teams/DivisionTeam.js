import React, {useState} from 'react';
import {EditTeamDetails} from "./EditTeamDetails";
import {Dialog} from "../common/Dialog";
import {Link} from "react-router-dom";
import {propChanged} from "../../Utilities";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";

export function DivisionTeam({team }) {
    const { id: divisionId, season, onReloadDivision } = useDivisionData();
    const { account } = useApp();
    const [ teamDetails, setTeamDetails ] = useState(Object.assign({ newDivisionId: divisionId }, team));
    const [ editTeam, setEditTeam ] = useState(false);
    const isAdmin = account && account.access && account.access.manageTeams;

    async function teamDetailSaved() {
        if (onReloadDivision) {
            await onReloadDivision();
        }

        setEditTeam(false);
    }

    function renderEditTeam() {
        return (<Dialog title={`Edit team: ${team.name}`}>
            <EditTeamDetails
                id={teamDetails.id}
                divisionId={divisionId}
                seasonId={season.id}
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
