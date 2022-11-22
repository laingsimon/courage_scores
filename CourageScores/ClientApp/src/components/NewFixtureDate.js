import React, { useState } from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {BootstrapDropdown} from "./BootstrapDropdown";
import {Dialog} from "./Dialog";

export function NewFixtureDate({ fixtures, allTeams, date, onNewTeam }) {
    const [ newHomeTeam, setNewHomeTeam ] = useState(null);
    const [ newAwayTeam, setNewAwayTeam ] = useState(null);
    const [ newTeamFor, setNewTeamFor ] = useState(null);
    const newTeam = { value: 'NEW_TEAM', text: 'Add a team...' };

    const unselectedTeamsInDivision = allTeams
        .filter(t => {
            const alreadySelected = fixtures.map(f => f.fixtures.filter(f => f.homeTeam.id === t.id || f.awayTeam.id === t.id).length).reduce((prev, count) => prev + count, 0);
            return alreadySelected === 0;
        })
        .map(t => { return { value: t.id, text: t.name } });

    function setHomeTeam(value) {
        if (value === newTeam.value) {
            setNewHomeTeam(null);
            setNewTeamFor('home');
        } else {
            setNewTeamFor(null);
            setNewHomeTeam(value);
        }
    }

    function setAwayTeam(value) {
        if (value === newTeam.value) {
            setNewAwayTeam(null);
            setNewTeamFor('away');
        } else {
            setNewTeamFor(null);
            setNewAwayTeam(value);
        }
    }

    function renderNewTeamDialog() {
        return (<Dialog title="Create a new team...">
          <p>New team inputs for {newTeamFor}</p>
        </Dialog>)
    }

    return (<tr>
        <td colSpan="2">
            <BootstrapDropdown
                value={newHomeTeam}
                onChange={setHomeTeam}
                options={unselectedTeamsInDivision.filter(t => t.value !== newAwayTeam).concat([ newTeam ])} />
        </td>
        <td colSpan="2">vs</td>
        <td>
            <BootstrapDropdown
                value={newAwayTeam}
                onChange={setAwayTeam}
                options={unselectedTeamsInDivision.filter(t => t.value !== newHomeTeam).concat([ newTeam ])} />
        </td>
        <td>
            {newTeamFor ? renderNewTeamDialog() : null}
            <button className="btn btn-sm btn-primary">Add game</button>
        </td>
    </tr>);
}
