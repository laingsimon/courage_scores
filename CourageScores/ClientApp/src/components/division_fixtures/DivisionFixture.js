import React, {useState} from 'react';
import {Link} from "react-router-dom";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {any, sortBy} from "../../Utilities";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";

export function DivisionFixture({fixture, date, readOnly, onUpdateFixtures, isKnockout, beforeReloadDivision }) {
    const bye = {
        text: 'Bye',
        value: '',
    };
    const { account, teams: allTeams } = useApp();
    const { id: divisionId, fixtures, season, teams, onReloadDivision, onError } = useDivisionData();
    const isAdmin = account && account.access && account.access.manageGames;
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [clipCellRegion, setClipCellRegion] = useState(true);
    const { gameApi } = useDependencies();
    const awayTeamId = fixture.awayTeam ? fixture.awayTeam.id : '';

    async function doReloadDivision() {
        if (beforeReloadDivision) {
            await beforeReloadDivision();
        }

        await onReloadDivision();
    }

    function isSelectedInAnotherFixtureOnThisDate(t) {
        const fixturesForThisDate = fixtures.filter(f => f.date === date)[0];
        if (!fixturesForThisDate || !fixturesForThisDate.fixtures) {
            return false;
        }

        // intentionally looks at qualifier games
        const realFixtures = fixturesForThisDate.fixtures.filter(f => f.awayTeam && f.homeTeam && f.id !== fixture.id);
        const selected = realFixtures.filter(f => f.homeTeam.id === t.id || f.awayTeam.id === t.id);
        return any(selected)
            ? selected[0]
            : null;
    }

    function isSelectedInSameFixtureOnAnotherDate(t) {
        for (let index = 0; index < fixtures.length; index++) {
            const fixtureDate = fixtures[index];
            if (fixtureDate.date === date) {
                continue;
            }

            if (any(fixtureDate.fixtures, f => f.isKnockout === false && f.homeTeam.id === fixture.homeTeam.id && f.awayTeam && f.awayTeam.id === t.id)) {
                return fixtureDate.date;
            }
        }

        return null;
    }

    function getLegsOnOtherDates(t) {
        const matchingFixtureDates = [];
        for (let index = 0; index < fixtures.length; index++) {
            const fixtureDate = fixtures[index];
            if (fixtureDate.date === date) {
                continue;
            }

            const fixtureDateFixtures = fixtureDate.fixtures;
            const equivalentFixtures = fixtureDateFixtures
                .filter(f => !f.isKnockout)
                .filter(f => (f.homeTeam.id === t.id && f.awayTeam && f.awayTeam.id === fixture.homeTeam.id)
                    || (f.homeTeam.id === fixture.homeTeam.id && f.awayTeam && f.awayTeam.id === t.id));

            if (any(equivalentFixtures)) {
                matchingFixtureDates.push(fixtureDate.date);
            }
        }

        return matchingFixtureDates;
    }

    function isSameAddress(t) {
        const otherTeamHasSameAddress = fixture.homeTeam.address === t.address;
        return otherTeamHasSameAddress && t.address !== 'Unknown';
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
        let sameFixtureDifferentDate = isSelectedInSameFixtureOnAnotherDate(t);
        if (sameFixtureDifferentDate) {
            return `Already playing same leg on ${new Date(sameFixtureDifferentDate).toDateString()}`;
        }
        let legsOnOtherDates = getLegsOnOtherDates(t);
        if (legsOnOtherDates.length >= 2) {
            return `Already playing both legs ${legsOnOtherDates.map(d => new Date(d).toDateString()).join(' & ')}`;
        }

        return null;
    }

    function onChangeAwayTeam(teamId) {
        onUpdateFixtures(currentFixtureDates => {
            const fixtureDate = currentFixtureDates.filter(fd => fd.date === date)[0];

            if (!fixtureDate) {
                console.error(`Could not find fixture date: ${date}`);
                return null;
            }

            if (!fixtureDate.fixtures) {
                console.error('Fixture date has no fixtures');
                return null;
            }

            const fixtureDateFixture = fixtureDate.fixtures.filter(f => f.id === fixture.id)[0];
            if (!fixtureDateFixture) {
                console.error(`Could not find fixture with id ${fixture.id}`);
                return null;
            }

            const newFixture = Object.assign({}, fixtureDateFixture);
            newFixture.originalAwayTeamId = newFixture.originalAwayTeamId || (newFixture.awayTeam ? newFixture.awayTeam.id : 'unset');
            newFixture.awayTeam = teamId
                ? { id: teamId, name: '' }
                : null;
            fixtureDate.fixtures = fixtureDate.fixtures.filter(f => f.id !== fixture.id).concat([ newFixture ]).sort(sortBy('homeTeam.name'));

            return currentFixtureDates;
        });
    }

    function renderAwayTeam() {
        if (!isAdmin || fixture.homeScore || fixture.awayScore) {
            return (fixture.awayTeam
               ? !fixture.proposal && awayTeamId && (fixture.id !== fixture.homeTeam.id)
                   ? (<Link to={`/score/${fixture.id}`} className="margin-right">{fixture.awayTeam.name}</Link>)
                   : null
               : 'Bye');
        }

        if (isKnockout) {
            const options = allTeams
                .filter(t => t.id !== fixture.homeTeam.id)
                .filter(t => any(t.seasons, ts => ts.seasonId === season.id))
                .map(t => {
                    const otherFixtureSameDate = isSelectedInAnotherFixtureOnThisDate(t);
                    const unavailableReason = otherFixtureSameDate
                        ? otherFixtureSameDate.awayTeam.id === t.id
                            ? `Already playing against ${otherFixtureSameDate.homeTeam.name}`
                            : `Already playing against ${otherFixtureSameDate.awayTeam.name}`
                        : null;

                    return {
                        value: t.id,
                        text: otherFixtureSameDate ? `🚫 ${t.name} (${unavailableReason})`: t.name,
                        disabled: !!otherFixtureSameDate
                    };
            });

            return (<BootstrapDropdown
                value={awayTeamId}
                onChange={onChangeAwayTeam}
                options={options}
                onOpen={toggleCellClip}
                disabled={deleting}
                readOnly={readOnly}
            />);
        }

        const byeOption = fixture.id !== fixture.homeTeam.id ? [] : [bye];
        const options = byeOption.concat(teams
            .filter(t => t.id !== fixture.homeTeam.id)
            .map(t => {
                const unavailableReason = getUnavailableReason(t);

                return {
                    value: t.id,
                    text: unavailableReason ? `🚫 ${t.name} (${unavailableReason})` : t.name,
                    disabled: !!unavailableReason
                };
            }));

        return (<BootstrapDropdown
            value={awayTeamId}
            onChange={onChangeAwayTeam}
            options={options}
            onOpen={toggleCellClip}
            disabled={deleting}
            readOnly={readOnly}
        />);
    }

    function toggleCellClip(isOpen) {
        setClipCellRegion(!isOpen);
    }

    async function saveTeamChange() {
        try {
            if (saving || deleting || readOnly) {
                return;
            }

            setSaving(true);
            if (awayTeamId === '') {
                const result = await gameApi.delete(fixture.id);

                if (result.success) {
                    await doReloadDivision();
                } else {
                    setSaveError(result);
                }
                return;
            }

            const result = await gameApi.update({
                id: undefined,
                address: fixture.homeTeam.address,
                divisionId: divisionId,
                homeTeamId: fixture.homeTeam.id,
                awayTeamId: awayTeamId,
                date: date,
                isKnockout: isKnockout,
                seasonId: season.id
            });

            if (result.success) {
                await doReloadDivision();
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    async function deleteGame() {
        try {
            if (deleting || saving || readOnly) {
                return;
            }

            if (!window.confirm(`Are you sure you want to delete this ${fixture.proposal ? 'proposal' : 'fixture'}?\n\n${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`)) {
                return;
            }

            if (fixture.proposal) {
                // remove the proposal
                if (onUpdateFixtures) {
                    await onUpdateFixtures(currentFixtureDates => {
                        const fixtureDate = currentFixtureDates.filter(fd => fd.date === date)[0];
                        if (!fixtureDate) {
                            window.alert(`Could not delete proposal, ${date} could not be found`);
                            return currentFixtureDates;
                        }
                        fixtureDate.fixtures = fixtureDate.fixtures.filter(f => f.id !== fixture.id);
                        return currentFixtureDates;
                    });
                } else {
                    window.alert('Cannot delete proposal');
                }
                return;
            }

            setDeleting(true);
            try {
                const result = await gameApi.delete(fixture.id);
                if (result.success) {
                    await doReloadDivision();
                } else {
                    setSaveError(result);
                }
            } finally {
                setDeleting(false);
            }
        } catch (exc) {
            onError(exc);
        }
    }

    async function saveProposal() {
        setSaving(true);
        try {
            const result = await gameApi.update({
                id: fixture.id,
                address: fixture.homeTeam.address,
                date: date,
                divisionId: divisionId,
                homeTeamId: fixture.homeTeam.id,
                awayTeamId: fixture.awayTeam.id,
                seasonId: season.id
            });

            if (result.success) {
                await onReloadDivision();
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    return (<tr className={(deleting ? 'text-decoration-line-through' : '') + (fixture.proposal ? ' bg-yellow' : '')}>
        <td>
            {!fixture.proposal && awayTeamId && (fixture.id !== fixture.homeTeam.id)
               ? (<Link to={`/score/${fixture.id}`} className="margin-right">{fixture.homeTeam.name}</Link>)
               : (<Link to={`/division/${divisionId}/team:${fixture.homeTeam.id}/${season.id}`} className="margin-right">{fixture.homeTeam.name}</Link>)}
        </td>
        <td className="narrow-column text-primary fw-bolder">{fixture.postponed ? 'P' : fixture.homeScore}</td>
        <td className="narrow-column">vs</td>
        <td className="narrow-column text-primary fw-bolder">{fixture.postponed ? 'P' : fixture.awayScore}</td>
        <td style={{overflow: (clipCellRegion ? 'clip' : 'initial')}}>
            {renderAwayTeam()}
        </td>
        {isAdmin ? (<td className="medium-column">
            {fixture.originalAwayTeamId && awayTeamId !== fixture.originalAwayTeamId && awayTeamId
                ? (<button disabled={readOnly} onClick={saveTeamChange} className="btn btn-sm btn-primary margin-right">{saving ? (
                    <span className="spinner-border spinner-border-sm" role="status"
                          aria-hidden="true"></span>) : '💾'}</button>)
                : null}
            {fixture.id !== fixture.homeTeam.id && awayTeamId && !saving && !deleting ? (
                <button disabled={readOnly} className="btn btn-sm btn-danger" onClick={deleteGame}>🗑</button>) : null}
            {fixture.proposal && awayTeamId && !saving && !deleting ? (
                <button disabled={readOnly} className="btn btn-sm btn-success" onClick={saveProposal}>💾</button>) : null}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)}
                                        title="Could not save fixture details"/>) : null}
        </td>) : null}
    </tr>)
}
