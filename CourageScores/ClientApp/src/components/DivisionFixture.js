import React, { useState } from 'react';
import {Link} from "react-router-dom";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import {GameApi} from "../api/game";

export function DivisionFixture({ fixture, divisionData, account, onReloadDivision, date }) {
    const isAdmin = account && account.access && account.access.manageGames;
    const [ awayTeamId, setAwayTeamId ] = useState(fixture.awayTeam ? fixture.awayTeam.id : '');
    const [ saving, setSaving ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);

    function isSelectedInAnotherFixtureOnThisDate(t) {
        const fixturesForThisDate = divisionData.fixtures.filter(f => f.date === date)[0];
        if (!fixturesForThisDate || !fixturesForThisDate.fixtures) {
            return false;
        }

        const realFixtures = fixturesForThisDate.fixtures.filter(f => f.awayTeam && f.homeTeam && f.id !== fixture.id);
        const isSelected = realFixtures.filter(f => f.homeTeam.id === t.id || f.awayTeam.id === t.id).length;
        return isSelected || false;
    }

    function isFixtureSelectedForAnotherDate(t) {
        for (let index = 0; index < divisionData.fixtures.length; index++) {
            const fixtureDate = divisionData.fixtures[index];
            if (fixtureDate.date === date) {
                continue;
            }

            const fixtureDateFixtures = fixtureDate.fixtures;
            const equivalentFixtures = fixtureDateFixtures.filter(f =>
                (f.homeTeam.id === t.id && f.awayTeam && f.awayTeam.id === fixture.homeTeam.id)
                || (f.homeTeam.id === fixture.homeTeam.id && f.awayTeam && f.awayTeam.id === t.id));

            if (equivalentFixtures.length) {
                return true;
            }
        }

        return false;
    }

    function isSameAddress(t) {
        const fixturesForThisDate = divisionData.fixtures.filter(f => f.date === date)[0];
        if (!fixturesForThisDate || !fixturesForThisDate.fixtures) {
            return false;
        }

        const homeTeam = fixturesForThisDate.fixtures.filter(f => f.homeTeam.id === t.id)[0];
        const awayTeam = fixturesForThisDate.fixtures.filter(f => f.awayTeam && f.awayTeam.id === t.id)[0];
        const teamAddress = homeTeam
            ? homeTeam.homeTeam.address
            : awayTeam
                ? awayTeam.awayTeam.address
                : null;

        if (!teamAddress || teamAddress === 'Unknown') {
            return false;
        }

        return teamAddress === fixture.homeTeam.address;
    }

    function isValidAwayTeam(t) {
        return t.id !== fixture.homeTeam.id
            && !isSelectedInAnotherFixtureOnThisDate(t)
            && !isSameAddress(t)
            && !isFixtureSelectedForAnotherDate(t);
    }

    function renderAwayTeam() {
        if (!isAdmin) {
            return (fixture.awayTeam ? fixture.awayTeam.name : 'Bye');
        }

        return (<select value={awayTeamId} onChange={(event) => setAwayTeamId(event.target.value)}>
            <option value={''}>Bye</option>
            {divisionData.teams.filter(isValidAwayTeam).map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>);
    }

    async function saveTeamChange() {
        try {
            if (saving || deleting) {
                return;
            }

            const api = new GameApi(new Http(new Settings()));
            setSaving(true);
            if (awayTeamId === '') {
                const result = await api.delete(fixture.id);

                if (result.success) {
                    if (onReloadDivision) {
                        await onReloadDivision();
                    }
                } else {
                    console.log(result);
                    alert('Could not delete the game');
                }
                return;
            }

            const result = await api.update({
                id: undefined,
                address: fixture.homeTeam.address,
                divisionId: divisionData.id,
                homeTeamId: fixture.homeTeam.id,
                awayTeamId: awayTeamId,
                date: date,
            });

            if (result.success) {
                if (onReloadDivision) {
                    await onReloadDivision();
                }
            } else {
                console.log(result);
                alert('Could not create the game');
            }
        } finally {
            setSaving(false);
        }
    }

    async function deleteGame() {
        if (deleting || saving) {
            return;
        }

        setDeleting(true);
        try {
            const api = new GameApi(new Http(new Settings()));
            const result = await api.delete(fixture.id);
            if (result.success) {
                await onReloadDivision();
            } else {
                console.log(result);
                alert(`Could not delete game`);
            }
        } finally {
            setDeleting(false);
        }
    }

    return (<tr key={fixture.id} className={deleting ? 'text-decoration-line-through' : ''}>
        <td>{fixture.homeTeam.name}</td>
        <td>{fixture.homeScore}</td>
        <td>vs</td>
        <td>{renderAwayTeam()}</td>
        <td>{fixture.awayScore}</td>
        <td>
            {isAdmin && awayTeamId !== (fixture.awayTeam ? fixture.awayTeam.id : '')
                ? (<button onClick={saveTeamChange} className="btn btn-sm btn-primary margin-right">{saving ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : '💾'}</button>)
                : null}
            {awayTeamId && (fixture.id !== fixture.homeTeam.id) ? <Link className="btn btn-sm btn-primary margin-right" to={`/score/${fixture.id}`}>🎯</Link> : null}
            {isAdmin && awayTeamId && !saving && !deleting ? (<button className="btn btn-sm btn-danger" onClick={deleteGame}>&times;</button>) : null}
        </td>
    </tr>)
}