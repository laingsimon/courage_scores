import React, { useState } from 'react';
import {Link} from "react-router-dom";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import {GameApi} from "../api/game";

export function DivisionFixture({ fixture, divisionData, account, onReloadDivision, date }) {
    const isAdmin = account && account.access && account.access.leagueAdmin;
    const [ awayTeamId, setAwayTeamId ] = useState(fixture.awayTeam ? fixture.awayTeam.id : '');

    function isSelectedInAnotherFixture(t) {
        const fixturesForThisDate = divisionData.fixtures.filter(f => f.date === date)[0];
        const realFixtures = fixturesForThisDate.fixtures.filter(f => f.awayTeam && f.homeTeam && f.id !== fixture.id);
        const isSelected = realFixtures.filter(f => f.homeTeam.id === t.id || f.awayTeam.id === t.id).length;
        return isSelected || false;
    }

    function isSameAddress(t) {
        const fixturesForThisDate = divisionData.fixtures.filter(f => f.date === date)[0];
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
            && !isSelectedInAnotherFixture(t)
            && !isSameAddress(t);
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
        const api = new GameApi(new Http(new Settings()));
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
    }

    return (<tr key={fixture.id}>
        <td>{fixture.homeTeam.name}</td>
        <td>{fixture.homeScore}</td>
        <td>vs</td>
        <td>{renderAwayTeam()}</td>
        <td>{fixture.awayScore}</td>
        <td>
            {isAdmin && awayTeamId !== (fixture.awayTeam ? fixture.awayTeam.id : '') ? (<button onClick={saveTeamChange} className="btn btn-sm btn-primary margin-right">💾</button>) : null}
            {awayTeamId && (fixture.id !== fixture.homeTeam.id) ? <Link className="btn btn-sm btn-primary margin-right" to={`/score/${fixture.id}`}>🎯</Link> : null}
        </td>
    </tr>)
}