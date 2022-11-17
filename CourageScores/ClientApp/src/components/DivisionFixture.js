import React, { useState } from 'react';
import {Link} from "react-router-dom";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import {GameApi} from "../api/game";
import {BootstrapDropdown} from "./BootstrapDropdown";

export function DivisionFixture({ fixture, divisionData, account, onReloadDivision, date }) {
    const bye = {
        text: 'Bye',
        value: '',
    };
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
        const selected = realFixtures.filter(f => f.homeTeam.id === t.id || f.awayTeam.id === t.id);
        return selected.length > 0
            ? selected[0]
            : null;
    }

    function isFixtureSelectedForAnotherDate(t) {
        const matchingFixtureDates = [];
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
                matchingFixtureDates.push(fixtureDate.date);
            }
        }

        return matchingFixtureDates;
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

    function getUnavailableReason(t) {
        if (isSameAddress(t)) {
            return `Same address`;
        }
        let otherFixtureSameDate = isSelectedInAnotherFixtureOnThisDate(t);
        if (otherFixtureSameDate) {
            return otherFixtureSameDate.awayTeam.id === t.id
                ? `Already playing against ${otherFixtureSameDate.homeTeam.name}`
                : `Already playing against ${otherFixtureSameDate.awayTeam.name}`;
       }
        let otherFixtureOtherDates = isFixtureSelectedForAnotherDate(t);
        if (otherFixtureOtherDates.length >= 2) {
            return `Already playing each other on ${otherFixtureOtherDates.map(d => new Date(d).toDateString()).join(' & ')}`;
        }

        return null;
    }

    function renderAwayTeam() {
        if (!isAdmin) {
            return (fixture.awayTeam ? fixture.awayTeam.name : 'Bye');
        }

        const options = [bye].concat(divisionData.teams
            .filter(t => t.id !== fixture.homeTeam.id)
            .map(t => {
                const unavailableReason = getUnavailableReason(t);

                return {
                    value: t.id,
                    text: unavailableReason ? `${t.name} (${unavailableReason})` : t.name,
                    disabled: !!unavailableReason };
            }));

        return (<BootstrapDropdown
            value={awayTeamId}
            onChange={(value) => setAwayTeamId(value)}
            options={options} />);
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
