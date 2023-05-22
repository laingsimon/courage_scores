import React, {useState} from 'react';
import {EditTeamDetails} from "./EditTeamDetails";
import {Dialog} from "../common/Dialog";
import {Link} from "react-router-dom";
import {propChanged} from "../../Utilities";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {AssignTeamToSeasons} from "./AssignTeamToSeasons";

export function DivisionTeam({ team }) {
    const { id: divisionId, season, onReloadDivision } = useDivisionData();
    const { account, onError } = useApp();
    const [ teamDetails, setTeamDetails ] = useState(Object.assign({ newDivisionId: divisionId }, team));
    const [ editTeam, setEditTeam ] = useState(false);
    const [ addTeamToSeason, setAddTeamToSeason ] = useState(false);
    const isAdmin = account && account.access && account.access.manageTeams;

    async function teamDetailSaved() {
        await onReloadDivision();

        setEditTeam(false);
    }

    function renderEditTeam() {
        try {
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
            </Dialog>);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function renderAddTeamToSeason() {
        try {
            return (<Dialog title="Assign seasons">
                <AssignTeamToSeasons teamOverview={team} onClose={() => setAddTeamToSeason(false)}/>
            </Dialog>);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    try {
        return (<tr>
            <td>
                {isAdmin ? (<button onClick={() => setEditTeam(true)}
                                    className="btn btn-sm btn-primary margin-right">✏️</button>) : null}
                {isAdmin ? (<button onClick={() => setAddTeamToSeason(true)}
                                    className="btn btn-sm btn-primary margin-right">➕</button>) : null}
                <Link to={`/division/${divisionId}/team:${team.id}`}>{team.name}</Link>
                {editTeam && isAdmin ? renderEditTeam() : null}
                {addTeamToSeason && isAdmin ? renderAddTeamToSeason() : null}
            </td>
            <td>{team.played}</td>
            <td>{team.points}</td>
            <td>{team.fixturesWon}</td>
            <td>{team.fixturesLost}</td>
            <td>{team.fixturesDrawn}</td>
            <td>{team.difference}</td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
