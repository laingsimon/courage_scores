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

export function DivisionFixtureDate({
                                        date,
                                        showPlayers,
                                        startAddNote,
                                        setEditNote,
                                        setShowPlayers,
                                        setNewFixtures,
                                        onTournamentChanged
                                    }) {
    const {account, controls} = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const {fixtures, teams} = useDivisionData();
    const isAdmin = account && account.access && account.access.manageGames;
    const isNoteAdmin = account && account.access && account.access.manageNotes;

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

        if (fixture.awayTeam) {
            // an away team has been selected; assume it is valid
            return true;
        }

        if (any(date.tournamentFixtures, t => !t.proposed)) {
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
                    fixturesUsingAddress: [],
                };
            });
        }

        setNewFixtures(fixtures.map(fd => fd.date === date.date ? newFixtureDate : fd));
    }

    const hasKnockoutFixture = any(date.fixtures, f => f.id !== f.homeTeam.id && f.isKnockout);
    const showQualifierToggle = isAdmin && ((!hasKnockoutFixture && !any(date.tournamentFixtures, f => !f.proposed) && !any(date.fixtures, f => f.id !== f.homeTeam.id)) || date.isNew);
    const allowTournamentProposals = !any(date.fixtures, f => f.id !== f.homeTeam.id || f.awayTeam || f.isKnockout);
    return (<div key={date.date} className={`${getClassName()}${date.isNew ? ' alert-success pt-3 mb-3' : ''}`}>
        <div data-fixture-date={date.date} className="bg-light"></div>
        <h4>
            📅 {renderDate(date.date)}
            {isNoteAdmin
                ? (<button className="btn btn-primary btn-sm margin-left" onClick={() => startAddNote(date.date)}>
                    📌 Add note
                </button>)
                : null}
            {any(date.tournamentFixtures, f => !f.proposed) && !date.isNew && controls ? (
                <span className="margin-left form-switch h6 text-body">
                    <input type="checkbox" className="form-check-input align-baseline"
                           id={'showPlayers_' + date.date} checked={showPlayers[date.date] || false}
                           onChange={() => toggleShowPlayers(date.date)}/>
                    <label className="form-check-label margin-left"
                           htmlFor={'showPlayers_' + date.date}>Who's playing?</label>
                </span>) : null}
            {showQualifierToggle ? (<span className="margin-left form-switch h6 text-body">
                    <input type="checkbox" className="form-check-input align-baseline"
                           disabled={any(date.fixtures, f => f.isKnockout && f.id !== f.homeTeam.id)}
                           id={'isKnockout_' + date.date}
                           checked={any(date.fixtures, f => f.isKnockout && f.id !== f.homeTeam.id) || date.isKnockout || false}
                           onChange={onChangeIsKnockout}/>
                    <label className="form-check-label margin-left"
                           htmlFor={'isKnockout_' + date.date}>Qualifier</label>
                </span>) : null}
        </h4>
        {date.notes.map(note => (<FixtureDateNote key={note.id} note={note} setEditNote={setEditNote}/>))}
        <table className="table layout-fixed">
            <tbody>
            {date.fixtures.filter(isPotentialFixtureValid).map(f => (<DivisionFixture
                key={f.id}
                fixture={f}
                date={date.date}
                onUpdateFixtures={onUpdateFixtures}/>))}
            {date.tournamentFixtures.filter(t => !date.isKnockout || !t.proposal || (allowTournamentProposals && t.proposal)).map(tournament => (
                <TournamentFixture
                    key={tournament.address + '-' + tournament.date}
                    tournament={tournament}
                    date={date.date}
                    onTournamentChanged={onTournamentChanged}
                    expanded={showPlayers[date.date]}/>))}
            </tbody>
        </table>
    </div>);
}
