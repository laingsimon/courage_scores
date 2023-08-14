import React, {useState} from 'react';
import {DivisionTeam} from "./DivisionTeam";
import {Dialog} from "../common/Dialog";
import {EditTeamDetails} from "./EditTeamDetails";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {sortBy} from "../../helpers/collections";
import {PrintDivisionHeading} from "../PrintDivisionHeading";

export function DivisionTeams() {
    const { id: divisionId, season, teams, onReloadDivision } = useDivisionData();
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
        await onReloadDivision();

        setNewTeam(false);
    }

    function renderNewTeamDialog() {
        return (<Dialog title="Create a new team...">
            <EditTeamDetails
                divisionId={divisionId}
                seasonId={season.id}
                team={teamDetails}
                onCancel={() => setNewTeam(false)}
                onSaved={onTeamCreated}
                onChange={onChange}/>
        </Dialog>);
    }

    return (<div className="content-background p-3">
        <PrintDivisionHeading />
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
                {teams.sort(sortBy('rank')).map(team => (<DivisionTeam
                    key={team.id}
                    team={team} />))}
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
