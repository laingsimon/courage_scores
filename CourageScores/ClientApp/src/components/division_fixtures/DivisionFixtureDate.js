import {getFilters, isInPast, isToday} from "./FilterUtilities";
import {any, isEmpty} from "../../Utilities";
import {FixtureDateNote} from "./FixtureDateNote";
import {DivisionFixture} from "./DivisionFixture";
import {TournamentFixture} from "./TournamentFixture";
import React from "react";
import {useApp} from "../../AppContainer";
import {useLocation, useNavigate} from "react-router-dom";
import {useDivisionData} from "../DivisionDataContainer";

export function DivisionFixtureDate({ date, filter, renderContext, proposingGames, showPlayers, startAddNote, setEditNote, setShowPlayers, setNewFixtures, onTournamentChanged }) {
    const { account } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const { fixtures } = useDivisionData();

    const isAdmin = account && account.access && account.access.manageGames;
    const isNoteAdmin = account && account.access && account.access.manageNotes;

    const filters = getFilters(filter, renderContext, fixtures);
    let fixturesForDate = (date.fixtures || []).filter(f => filters.apply({ date: date.date, fixture: f, tournamentFixture: null }));
    const tournamentFixturesForDate = (date.tournamentFixtures || []).filter(f => filters.apply({ date: date.date, fixture: null, tournamentFixture: f }));
    const notesForDate = date.notes;

    const hasFixtures = any(date.fixtures, f => f.id !== f.homeTeam.id);
    if (!isAdmin && !hasFixtures) {
        fixturesForDate = []; // no fixtures defined for this date, and not an admin so none can be defined, hide all the teams
    }

    if (isEmpty(fixturesForDate) && isEmpty(tournamentFixturesForDate) && isEmpty(notesForDate)) {
        return null;
    }

    function hasProposals(fixtures) {
        return any(fixtures, f => f.proposal);
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

        if (!isInPast(date.date) && !hasProposals(date.fixtures)) {
            return 'text-secondary-50';
        }

        return '';
    }

    return (<div key={date.date} className={`${getClassName()}${date.isNew ? ' alert-success' : ''}`}>
        <div data-fixture-date={date.date} className="bg-light"></div>
        <h4>
            📅 {new Date(date.date).toDateString()}{date.hasKnockoutFixture ? (<span> (Qualifier)</span>) : null}
            {isNoteAdmin ? (<button className="btn btn-primary btn-sm margin-left" onClick={() => startAddNote(date.date)}>📌 Add note</button>) : null}
            {any(tournamentFixturesForDate) ? (
                <span className="margin-left form-switch h6 text-body">
                        <input type="checkbox" className="form-check-input align-baseline"
                               id={'showPlayers_' + date.date} checked={showPlayers[date.date] || false} onChange={() => toggleShowPlayers(date.date)} />
                        <label className="form-check-label margin-left" htmlFor={'showPlayers_' + date.date}>Who's playing?</label>
                    </span>) : null}
        </h4>
        {notesForDate.map(note => (<FixtureDateNote key={note.id} note={note} setEditNote={setEditNote} />))}
        <table className="table layout-fixed">
            <tbody>
            {fixturesForDate.map(f => (<DivisionFixture
                key={f.id}
                fixture={f}
                readOnly={proposingGames}
                date={date.date}
                isKnockout={f.isKnockout}
                onUpdateFixtures={(apply) => setNewFixtures(apply(fixtures))} />))}
            {tournamentFixturesForDate.map(tournament => (<TournamentFixture
                key={tournament.address + '-' + tournament.date}
                tournament={tournament}
                date={date.date}
                onTournamentChanged={onTournamentChanged}
                expanded={showPlayers[date.date]} />))}
            </tbody>
        </table>
    </div>);
}