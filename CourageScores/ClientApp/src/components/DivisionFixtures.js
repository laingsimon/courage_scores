import React, { useState } from 'react';
import {DivisionFixture} from "./DivisionFixture";

export function DivisionFixtures({ divisionId, account, onReloadDivision, teams, fixtures, season }) {
    const isAdmin = account && account.access && account.access.manageGames;
    const [ newDate, setNewDate ] = useState('');

    async function onNewDateCreated() {
        setNewDate('');
        await onReloadDivision();
    }

    function renderNewFixture(team) {
        const newFixture = {
            id: team.id,
            homeTeam: {
                id: team.id,
                name: team.name,
                address: team.address,
            },
            awayTeam: null,
        };

        return (<DivisionFixture
            key={team.id}
            onReloadDivision={onNewDateCreated}
            fixtures={fixtures}
            teams={teams}
            divisionId={divisionId}
            account={account}
            fixture={newFixture}
            date={newDate}/>);
    }

    function renderNewTeamSelection() {
        return (<tr>
            <td colSpan="2">
                <select>
                    <option>A team from a previous season NOT already playing a fixture in this season</option>
                    <option>Add a team...</option>
                </select>
            </td>
            <td colSpan="2">vs</td>
            <td>
                <select>
                    <option>A team from a previous season NOT already playing a fixture in this season</option>
                    <option>Add a team...</option>
                </select>
            </td>
        </tr>)
    }

    return (<div className="light-background p-3">
        <div>
            {fixtures.map(date => (<div key={date.date}>
                <h4>{new Date(date.date).toDateString()}</h4>
                <table className="table layout-fixed">
                    <tbody>
                    {date.fixtures.map(f => (<DivisionFixture
                        key={f.id}
                        teams={teams}
                        fixtures={fixtures}
                        divisionId={divisionId}
                        onReloadDivision={onReloadDivision}
                        account={account}
                        fixture={f}
                        date={date.date}/>))}
                    {isAdmin ? renderNewTeamSelection() : null}
                    </tbody>
                </table>
            </div>))}
        </div>
        {isAdmin ? (<div className="mt-3">
            <div>
                <span className="margin-right">New fixture:</span>
                <input type="date" min={season.startDate.substring(0, 10)} max={season.endDate.substring(0, 10)} className="margin-right" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
            </div>
            {newDate ? (<table className="table layout-fixed">
                <tbody>
                    {teams.map(t => (renderNewFixture(t)))}
                    {renderNewTeamSelection()}
                </tbody>
            </table>) : null}
        </div>) : null}
    </div>);
}
