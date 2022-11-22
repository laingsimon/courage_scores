import React, { useState } from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./NewFixtureDate";

export function DivisionFixtures({ divisionId, account, onReloadDivision, teams, fixtures, season, onNewTeam }) {
    const isAdmin = account && account.access && account.access.manageGames;
    const [ newDate, setNewDate ] = useState('');

    async function onNewDateCreated() {
        setNewDate('');
        if (onReloadDivision) {
            await onReloadDivision();
        }
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
                    {isAdmin ? (<NewFixtureDate fixtures={fixtures} teams={teams} date={date.date} divisionId={divisionId} seasonId={season.id} onNewTeam={onNewTeam} />) : null}
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
                    <NewFixtureDate fixtures={fixtures} teams={teams} onNewTeam={onNewTeam} date={newDate} divisionId={divisionId} seasonId={season.id} />
                </tbody>
            </table>) : null}
        </div>) : null}
    </div>);
}
