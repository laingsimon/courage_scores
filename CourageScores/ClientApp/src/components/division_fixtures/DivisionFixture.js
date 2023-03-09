import React, {useState} from 'react';
import {Link} from "react-router-dom";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {Dialog} from "../common/Dialog";
import {EditTeamDetails} from "../division_teams/EditTeamDetails";
import {any, propChanged} from "../../Utilities";
import {useDependencies} from "../../Dependencies";

export function DivisionFixture({fixture, account, onReloadDivision, date, divisionId, fixtures, teams, seasonId, readOnly, allowTeamEdit, allowTeamDelete, allTeams, isKnockout }) {
    const bye = {
        text: 'Bye',
        value: '',
    };
    const isAdmin = account && account.access && account.access.manageGames;
    const [awayTeamId, setAwayTeamId] = useState(fixture.awayTeam ? fixture.awayTeam.id : '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [clipCellRegion, setClipCellRegion] = useState(true);
    const [deletingHomeTeam, setDeletingHomeTeam] = useState(false);
    const [editTeamMode, setEditTeamMode] = useState(null);
    const [teamDetails, setTeamDetails] = useState(null);
    const [proposal, setProposal] = useState(fixture.proposal);
    const { gameApi, teamApi } = useDependencies();

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

    function renderAwayTeam() {
        if (!isAdmin || fixture.homeScore || fixture.awayScore) {
            return (fixture.awayTeam
               ? !proposal && awayTeamId && (fixture.id !== fixture.homeTeam.id)
                   ? (<Link to={`/score/${fixture.id}`} className="margin-right">{fixture.awayTeam.name}</Link>)
                   : null
               : 'Bye');
        }

        if (isKnockout) {
            const options = allTeams
                .filter(t => t.id !== fixture.homeTeam.id)
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
                onChange={(value) => setAwayTeamId(value)}
                options={options}
                onOpen={toggleCellClip}
                disabled={deleting}
                readOnly={readOnly}
            />);
        }

        const options = [bye].concat(teams
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
            onChange={(value) => setAwayTeamId(value)}
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
                    if (onReloadDivision) {
                        await onReloadDivision();
                    }
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
                isKnockout: isKnockout
            });

            if (result.success) {
                if (onReloadDivision) {
                    await onReloadDivision();
                }
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    async function deleteGame() {
        if (deleting || saving || readOnly) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete this game?\n\n${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`)) {
            return;
        }

        setDeleting(true);
        try {
            const result = await gameApi.delete(fixture.id);
            if (result.success) {
                if (onReloadDivision) {
                    await onReloadDivision();
                }
            } else {
                setSaveError(result);
            }
        } finally {
            setDeleting(false);
        }
    }

    async function deleteTeam() {
        if (deleting || saving || readOnly) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the ${fixture.homeTeam.name} team?`)) {
            return;
        }

        setDeletingHomeTeam(true);
        try {
            const response = await teamApi.delete(fixture.homeTeam.id, seasonId);

            if (response.success) {
                await onReloadDivision();
            } else {
                setSaveError(response);
            }
        } finally {
            setDeletingHomeTeam(false);
        }
    }

    function editTeam(type) {
        if (readOnly) {
            return;
        }

        setTeamDetails(Object.assign({}, fixture[type + 'Team']));
        setEditTeamMode(type);
    }

    async function teamDetailSaved() {
        if (onReloadDivision) {
            await onReloadDivision();
        }

        setEditTeamMode(null);
    }

    function renderEditTeam() {
        if (readOnly) {
            return;
        }

        return (<Dialog title={`Edit team: ${fixture[editTeamMode + 'Team'].name}`}>
            <EditTeamDetails
                id={teamDetails.id}
                divisionId={divisionId}
                seasonId={seasonId}
                name={teamDetails.name}
                address={teamDetails.address}
                onCancel={() => setEditTeamMode(null)}
                onChange={propChanged(teamDetails, setTeamDetails)}
                onSaved={teamDetailSaved}
            />
        </Dialog>)
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
            });

            if (result.success) {
                setProposal(null);
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    return (<tr className={(deleting ? 'text-decoration-line-through' : '') + (proposal ? ' bg-yellow' : '')}>
        <td>
            {isAdmin && allowTeamEdit ? (
                <button className="btn btn-sm btn-primary margin-right" disabled={readOnly} onClick={() => editTeam('home')}>✏</button>
            ) : null}
            {isAdmin && allowTeamDelete ? (
                <button className={`btn btn-sm ${awayTeamId ? 'btn-secondary' : 'btn-danger'} margin-right`}
                        onClick={deleteTeam} disabled={awayTeamId || readOnly}>
                    {deletingHomeTeam ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : (
                        <span>🗑</span>)}
                </button>
            ) : null}
            {!proposal && awayTeamId && (fixture.id !== fixture.homeTeam.id)
               ? (<Link to={`/score/${fixture.id}`} className="margin-right">{fixture.homeTeam.name}</Link>)
               : (<Link to={`/division/${divisionId}/team:${fixture.homeTeam.id}/${seasonId}`} className="margin-right">{fixture.homeTeam.name}</Link>)}

            {editTeamMode ? renderEditTeam() : null}
        </td>
        <td className="narrow-column text-primary fw-bolder">{fixture.postponed ? 'P' : fixture.homeScore}</td>
        <td className="narrow-column">vs</td>
        <td className="narrow-column text-primary fw-bolder">{fixture.postponed ? 'P' : fixture.awayScore}</td>
        <td style={{overflow: (clipCellRegion ? 'clip' : 'initial')}}>
            {isAdmin && allowTeamEdit ? (
                <button className={`btn btn-sm ${awayTeamId ? 'btn-primary' : 'btn-secondary'} margin-right`}
                        disabled={!awayTeamId || readOnly} onClick={() => {
                    if (awayTeamId) {
                        editTeam('away')
                    }
                }}>✏</button>
            ) : null}
            {renderAwayTeam()}
        </td>
        {isAdmin ? (<td className="medium-column">
            {awayTeamId !== (fixture.awayTeam ? fixture.awayTeam.id : '')
                ? (<button disabled={readOnly} onClick={saveTeamChange} className="btn btn-sm btn-primary margin-right">{saving ? (
                    <span className="spinner-border spinner-border-sm" role="status"
                          aria-hidden="true"></span>) : '💾'}</button>)
                : null}
            {!proposal && awayTeamId && !saving && !deleting ? (
                <button disabled={readOnly} className="btn btn-sm btn-danger" onClick={deleteGame}>🗑</button>) : null}
            {proposal && awayTeamId && !saving && !deleting ? (
                <button disabled={readOnly} className="btn btn-sm btn-success" onClick={saveProposal}>💾</button>) : null}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)}
                                        title="Could not save fixture details"/>) : null}
        </td>) : null}
    </tr>)
}
