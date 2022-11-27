import React, {useState} from 'react';
import {DivisionTeam} from "./DivisionTeam";
import {Dialog} from "../common/Dialog";
import {EditTeamDetails} from "./EditTeamDetails";

export function DivisionTeams({ teams, teamsWithoutFixtures, account, divisionId, seasonId, onTeamSaved }) {
    const isAdmin = account && account.access && account.access.manageTeams;
    const [ newTeam, setNewTeam ] = useState(false);
    const [ teamDetails, setTeamDetails ] = useState({
        name: '',
        address: '',
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
                seasonId={seasonId}
                {...teamDetails}
                onCancel={() => setNewTeam(false)}
                id={null}
                onSaved={onTeamCreated}
                onChange={onChange}/>
        </Dialog>);
    }

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
                {teams.map(team => (<DivisionTeam
                    key={team.id}
                    team={team}
                    seasonId={seasonId}
                    account={account}
                    divisionId={divisionId}
                    onTeamSaved={onTeamSaved} />))}
                {teamsWithoutFixtures.length ? (<tr><td colSpan="7" className="text-center text-primary fw-bold">Teams Without Fixtures</td></tr>) : null}
                {teamsWithoutFixtures.map(team => (<DivisionTeam
                    key={team.id}
                    team={team}
                    seasonId={seasonId}
                    account={account}
                    divisionId={divisionId}
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
