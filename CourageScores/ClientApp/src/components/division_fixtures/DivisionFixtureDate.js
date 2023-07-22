import {getFixtureFilters} from "../../helpers/filters";
import {any} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {FixtureDateNote} from "./FixtureDateNote";
import {DivisionFixture} from "./DivisionFixture";
import {TournamentFixture} from "./TournamentFixture";
import React from "react";
import {useApp} from "../../AppContainer";
import {useLocation, useNavigate} from "react-router-dom";
import {useDivisionData} from "../DivisionDataContainer";
import {isInPast, isToday} from "../../helpers/dates";

export function DivisionFixtureDate({ date, filter, showPlayers, startAddNote, setEditNote, setShowPlayers, setNewFixtures, onTournamentChanged }) {
    const { account, controls } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const { fixtures, teams } = useDivisionData();
    const isAdmin = account && account.access && account.access.manageGames;
    const isNoteAdmin = account && account.access && account.access.manageNotes;
    const fixtureFilters = getFixtureFilters(filter);
    const tournamentFixturesForDate = (date.tournamentFixtures || []).filter(f => fixtureFilters.apply({ date: date.date, fixture: null, tournamentFixture: f, note: null }));
    const notesForDate = date.notes.filter(n => fixtureFilters.apply({ date: date.date, fixture: null, tournamentFixture: null, note: n }));
    const hasFixtures = any(date.fixtures, f => f.id !== f.homeTeam.id);
    const fixturesForDate = (!isAdmin && !hasFixtures)
        ? []
        : (date.fixtures || []).filter(f => fixtureFilters.apply({ date: date.date, fixture: f, tournamentFixture: null, note: null }));
    const showDatesWithNotesAndNoFixtures = filter.notes !== 'only-with-fixtures';
    const hasFixturesToShow = any(fixturesForDate) || any(tournamentFixturesForDate);
    const hasSomethingToShow = hasFixturesToShow || (any(notesForDate) && showDatesWithNotesAndNoFixtures)

    if (!hasSomethingToShow) {
        return null;
    }

    function toggleShowPlayers(date) {
        const newShowPlayers = Object.assign({}, showPlayers);
        if (newShowPlayers[date]) {
            delete newShowPlayers[date];
        } else {
            newShowPlayers[date] = true;
        }
        setShowPlayers(newShowPlayers);

        navigate({
            pathname: location.pathname,
            search: location.search,
            hash: any(Object.keys(newShowPlayers))
                ? 'show-who-is-playing'
                : '',
        });
    }

    function getClassName() {
        if (date.isNew) {
            return '';
        }

        if (isToday(date.date)) {
            return 'text-primary';
        }

        if (!isInPast(date.date)) {
            return 'text-secondary-50';
        }

        return '';
    }

    function onUpdateFixtures(adaptFixtures) {
        const newFixtures = adaptFixtures(fixtures);

        if (newFixtures) {
            setNewFixtures(newFixtures);
        }
    }

    function isPotentialFixtureValid(fixture) {
        if (fixture.id !== fixture.homeTeam.id) {
            return true; // a real fixture
        }

        if (fixture.awayTeam !== null) {
            // an away team has been selected; assume it is valid
            return true;
        }

        if (any(tournamentFixturesForDate, t => !t.proposed)) {
            return false;
        }

        if (any(date.fixtures, f => f.isKnockout) && !fixture.awayTeam && !isAdmin) {
            // don't show byes for any knockout/qualifier fixtures when logged out
            return false;
        }

        const fixturesForThisTeam = date.fixtures
            .filter(f => f.awayTeam) // a created fixture
            .filter(f => f.homeTeam.id === fixture.homeTeam.id || f.awayTeam.id === fixture.homeTeam.id);

        return !any(fixturesForThisTeam);
    }

    function onChangeIsKnockout(event) {
        const newFixtureDate = Object.assign({}, date);
        newFixtureDate.isKnockout = event.target.checked;

        if (!any(date.fixtures, f => f.id !== f.homeTeam.id)) {
            // no fixtures exist yet, can replace them all
            newFixtureDate.fixtures = teams.map(team => {
                return {
                    id: team.id,
                    homeTeam: {
                        id: team.id,
                        name: team.name,
                        address: team.address,
                    },
                    awayTeam: null,
                    isKnockout: newFixtureDate.isKnockout,
                    accoladesCount: true,
                };
            });
        }

        setNewFixtures(fixtures.map(fd => fd.date === date.date ? newFixtureDate : fd));
    }

    const hasKnockoutFixture = any(fixturesForDate, f => f.id !== f.homeTeam.id && f.isKnockout);
    const showQualifierToggle = isAdmin && ((!hasKnockoutFixture && !any(tournamentFixturesForDate, f => !f.proposed) && !any(fixturesForDate, f => f.id !== f.homeTeam.id)) || date.isNew);
    return (<div key={date.date} className={`${getClassName()}${date.isNew ? ' alert-success pt-3 mb-3' : ''}`}>
        <div data-fixture-date={date.date} className="bg-light"></div>
        <h4>
            📅 {renderDate(date.date)}
            {isNoteAdmin ? (<button className="btn btn-primary btn-sm margin-left" onClick={() => startAddNote(date.date)}>📌 Add note</button>) : null}
            {any(tournamentFixturesForDate, f => !f.proposed) && !date.isNew && controls ? (
                <span className="margin-left form-switch h6 text-body">
                    <input type="checkbox" className="form-check-input align-baseline"
                           id={'showPlayers_' + date.date} checked={showPlayers[date.date] || false} onChange={() => toggleShowPlayers(date.date)} />
                    <label className="form-check-label margin-left" htmlFor={'showPlayers_' + date.date}>Who's playing?</label>
                </span>) : null}
            {showQualifierToggle ? (<span className="margin-left form-switch h6 text-body">
                    <input type="checkbox" className="form-check-input align-baseline"
                           disabled={any(fixturesForDate, f => f.isKnockout && f.id !== f.homeTeam.id)}
                           id={'isKnockout_' + date.date}
                           checked={any(fixturesForDate, f => f.isKnockout && f.id !== f.homeTeam.id) || date.isKnockout || false}
                           onChange={onChangeIsKnockout} />
                    <label className="form-check-label margin-left" htmlFor={'isKnockout_' + date.date}>Qualifier</label>
                </span>) : null}
        </h4>
        {notesForDate.map(note => (<FixtureDateNote key={note.id} note={note} setEditNote={setEditNote} />))}
        <table className="table layout-fixed">
            <tbody>
            {fixturesForDate.filter(isPotentialFixtureValid).map(f => (<DivisionFixture
                key={f.id}
                fixture={f}
                date={date.date}
                onUpdateFixtures={onUpdateFixtures} />))}
            {any(fixturesForDate, f => f.id !== f.homeTeam.id || f.awayTeam || f.isKnockout) || date.isKnockout ? null : tournamentFixturesForDate.map(tournament => (<TournamentFixture
                key={tournament.address + '-' + tournament.date}
                tournament={tournament}
                date={date.date}
                onTournamentChanged={onTournamentChanged}
                expanded={showPlayers[date.date]} />))}
            </tbody>
        </table>
    </div>);
}
