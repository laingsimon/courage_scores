import React, {useState} from 'react';
import {DivisionTeam} from "./DivisionTeam";
import {Dialog} from "../common/Dialog";
import {EditTeamDetails} from "./EditTeamDetails";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";

export function DivisionTeams({ onTeamSaved }) {
    const { id: divisionId, season, teams } = useDivisionData();
    const { account } = useApp();
    const isAdmin = account && account.access && account.access.manageTeams;
    const [ newTeam, setNewTeam ] = useState(false);
    const [ teamDetails, setTeamDetails ] = useState({
        name: '',
        address: '',
        newDivisionId: divisionId
    });

    function onChange(name, value) {
        const newTeamDetails = Object.assign({}, teamDetails);
        newTeamDetails[name] = value;
        setTeamDetails(newTeamDetails);
    }

    async function onTeamCreated() {
        if (onTeamSaved) {
            await onTeamSaved();
        }

        setNewTeam(false);
    }

    function renderNewTeamDialog() {
        return (<Dialog title="Create a new team...">
            <EditTeamDetails
                divisionId={divisionId}
                seasonId={season.id}
                {...teamDetails}
                onCancel={() => setNewTeam(false)}
                id={null}
                onSaved={onTeamCreated}
                onChange={onChange}/>
        </Dialog>);
    }

    return (<div className="light-background p-3">
        <div className="overflow-x-auto">
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
                {teams.map(team => (<DivisionTeam
                    key={team.id}
                    team={team}
                    onTeamSaved={onTeamSaved} />))}
                </tbody>
            </table>
        </div>
        {isAdmin ? (<div>
            <div>
                <button className="btn btn-sm btn-primary" onClick={() => setNewTeam(true)}>Add team</button>
            </div>
            {newTeam ? renderNewTeamDialog() : null}
        </div>) : null}
    </div>);
}
