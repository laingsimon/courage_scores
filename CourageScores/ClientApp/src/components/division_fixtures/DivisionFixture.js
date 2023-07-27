import React, {useState} from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {renderDate} from "../../helpers/rendering";
import {any, sortBy} from "../../helpers/collections";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {EmbedAwareLink} from "../common/EmbedAwareLink";

export function DivisionFixture({fixture, date, readOnly, onUpdateFixtures, beforeReloadDivision }) {
    const bye = {
        text: 'Bye',
        value: '',
    };
    const { account, teams: allTeams, onError } = useApp();
    const { id: divisionId, name: divisionName, fixtures, season, teams, onReloadDivision } = useDivisionData();
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
        const matching = fixtures.filter(fixtureDate => {
            if (fixtureDate.date === date) {
                return false;
            }

            return any(fixtureDate.fixtures, f => f.isKnockout === false && f.homeTeam.id === fixture.homeTeam.id && f.awayTeam && f.awayTeam.id === t.id);
        });

        return any(matching) ? matching[0].date : null;
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
            return `Already playing same leg on ${renderDate(sameFixtureDifferentDate)}`;
        }

        return null;
    }

    function onChangeAwayTeam(teamId) {
        if (readOnly) {
            return;
        }

        onUpdateFixtures(currentFixtureDates => {
            const fixtureDate = currentFixtureDates.filter(fd => fd.date === date)[0];

            // istanbul ignore next
            if (!fixtureDate) {
                onError(`Could not find fixture date: ${date}`);
                return null;
            }

            // istanbul ignore next
            if (!fixtureDate.fixtures) {
                onError('Fixture date has no fixtures');
                return null;
            }

            const fixtureDateFixture = fixtureDate.fixtures.filter(f => f.id === fixture.id)[0];
            // istanbul ignore next
            if (!fixtureDateFixture) {
                onError(`Could not find fixture with id ${fixture.id}`);
                return null;
            }

            const newFixture = Object.assign({}, fixtureDateFixture);
            newFixture.originalAwayTeamId = newFixture.originalAwayTeamId || (newFixture.awayTeam ? newFixture.awayTeam.id : 'unset');
            const team = teams.filter(t => t.id === teamId)[0];
            newFixture.awayTeam = teamId
                ? { id: teamId, name: team ? team.name : '<unknown>' }
                : null;
            fixtureDate.fixtures = fixtureDate.fixtures.filter(f => f.id !== fixture.id).concat([ newFixture ]).sort(sortBy('homeTeam.name'));

            return currentFixtureDates;
        });
    }

    function renderKnockoutAwayTeams() {
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

    function renderLeagueAwayTeams() {
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

    function renderAwayTeam() {
        if (!isAdmin || fixture.homeScore || fixture.awayScore) {
            return (fixture.awayTeam
               ? awayTeamId && (fixture.id !== fixture.homeTeam.id)
                   ? (<EmbedAwareLink to={`/score/${fixture.id}`} className="margin-right">{fixture.awayTeam.name}</EmbedAwareLink>)
                   : null
               : 'Bye');
        }

        if (any(fixture.fixturesUsingAddress)) {
            return (<div>
                {fixture.fixturesUsingAddress.map((otherFixture, index) => {
                    return (<div key={index}>🚫 <EmbedAwareLink to={`/score/${otherFixture.id}`}><strong>{otherFixture.home.name}</strong> vs <strong>{otherFixture.away.name}</strong> using this venue</EmbedAwareLink></div>)
                })}
            </div>);
        }

        return fixture.isKnockout
            ? renderKnockoutAwayTeams()
            : renderLeagueAwayTeams();
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
            const result = await gameApi.update({
                id: undefined,
                address: fixture.homeTeam.address,
                divisionId: divisionId,
                homeTeamId: fixture.homeTeam.id,
                awayTeamId: awayTeamId,
                date: date,
                isKnockout: fixture.isKnockout,
                seasonId: season.id,
                accoladesCount: fixture.accoladesCount,
            }, null);

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

            if (!window.confirm(`Are you sure you want to delete this fixture?\n\n${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`)) {
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
            /* istanbul ignore next */
            onError(exc);
        }
    }

    return (<tr className={(deleting ? 'text-decoration-line-through' : '')}>
        <td>
            {awayTeamId && (fixture.id !== fixture.homeTeam.id)
               ? (<EmbedAwareLink to={`/score/${fixture.id}`} className="margin-right">{fixture.homeTeam.name}</EmbedAwareLink>)
               : (<EmbedAwareLink to={`/division/${divisionName}/team:${fixture.homeTeam.name}/${season.name}`} className="margin-right">{fixture.homeTeam.name}</EmbedAwareLink>)}
        </td>
        <td className="narrow-column text-primary fw-bolder">{fixture.postponed ? (<span className="text-danger">P</span>) : fixture.homeScore}</td>
        <td className="narrow-column">vs</td>
        <td className="narrow-column text-primary fw-bolder">{fixture.postponed ? (<span className="text-danger">P</span>) : fixture.awayScore}</td>
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
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)}
                                        title="Could not save fixture details"/>) : null}
        </td>) : null}
    </tr>)
}
