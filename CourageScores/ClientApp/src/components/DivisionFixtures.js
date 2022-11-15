import React, { useState } from 'react';
import {DivisionFixture} from "./DivisionFixture";

export function DivisionFixtures({ divisionData, account, onReloadDivision }) {
    const isAdmin = account && account.access && account.access.manageFixtures;
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
            divisionData={divisionData}
            account={account}
            fixture={newFixture}
            date={newDate}/>);
    }

    return (<div className="light-background p-3 overflow-auto">
        {divisionData.fixtures.map(date => (<div key={date.date}>
            <h4>{new Date(date.date).toDateString()}</h4>
            <table className="table layout-fixed">
                <tbody>
                {date.fixtures.map(f => (<DivisionFixture key={f.id} onReloadDivision={onReloadDivision} divisionData={divisionData} account={account} fixture={f} date={date.date}/>))}
                </tbody>
            </table>
        </div>))}
        {isAdmin ? (<div>
            <div>
                <span className="margin-right">New fixture:</span>
                <input type="date" className="margin-right" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
            </div>
            {newDate ? (<table className="table layout-fixed">
                <tbody>
                    {divisionData.teams.map(t => (renderNewFixture(t)))}
                </tbody>
            </table>) : null}
        </div>) : null}
    </div>);
}
