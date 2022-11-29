import React, { useState } from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./scores/NewFixtureDate";

export function DivisionFixtures({ divisionId, account, onReloadDivision, teams, fixtures, season, onNewTeam, onProposeFixtures }) {
    const isAdmin = account && account.access && account.access.manageGames;
    const [ newDate, setNewDate ] = useState('');
    const [ proposingGames, setProposingGames ] = useState(false);

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
            seasonId={season.id}
            divisionId={divisionId}
            account={account}
            fixture={newFixture}
            date={newDate}/>);
    }

    async function proposeFixtures() {
        if (proposingGames) {
            return;
        }

        setProposingGames(true);
        try {
            await onProposeFixtures();
        } finally {
            setProposingGames(false);
        }
    }

    return (<div className="light-background p-3">
        {isAdmin && onProposeFixtures ? (<div><button className="btn btn-warning" onClick={proposeFixtures}>
            {proposingGames ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            Propose games
        </button></div>) : null}
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
                        seasonId={season.id}
                        onReloadDivision={onReloadDivision}
                        account={account}
                        fixture={f}
                        date={date.date}/>))}
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
