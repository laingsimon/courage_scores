import React, {useState} from 'react';
import {FilterFixtures} from "./FilterFixtures";
import {useLocation, useNavigate} from "react-router-dom";
import {EditNote} from "./EditNote";
import {any, isEmpty, sortBy} from "../../helpers/collections";
import {stateChanged} from "../../helpers/events";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {DivisionFixtureDate} from "./DivisionFixtureDate";
import {changeFilter, getFixtureDateFilters, getFixtureFilters, initFilter} from "../../helpers/filters";
import {Dialog} from "../common/Dialog";
import {CreateSeasonDialog} from "./season_creation/CreateSeasonDialog";

export function DivisionFixtures({setNewFixtures}) {
    const {id: divisionId, season, fixtures, onReloadDivision} = useDivisionData();
    const navigate = useNavigate();
    const location = useLocation();
    const {account, onError, controls, teams} = useApp();
    const isAdmin = account && account.access && account.access.manageGames;
    const [newDate, setNewDate] = useState('');
    const [newDateDialogOpen, setNewDateDialogOpen] = useState(false);
    const [isKnockout, setIsKnockout] = useState(false);
    const [filter, setFilter] = useState(initFilter(location));
    const [editNote, setEditNote] = useState(null);
    const [showPlayers, setShowPlayers] = useState(getPlayersToShow());
    const [createFixturesDialogOpen, setCreateFixturesDialogOpen] = useState(false);

    function getPlayersToShow() {
        if (location.hash !== '#show-who-is-playing') {
            return {};
        }

        const newShowPlayers = {};
        fixtures.forEach(fixtureDate => {
            if (any(fixtureDate.tournamentFixtures)) {
                newShowPlayers[fixtureDate.date] = true;
            }
        });
        return newShowPlayers;
    }

    async function onTournamentChanged() {
        const divisionData = await onReloadDivision();
        setNewFixtures(divisionData.fixtures);
        setNewDate('');
    }

    function renderFixtureDate(fixtureDate) {
        return (<DivisionFixtureDate
            key={fixtureDate.date + (fixtureDate.isNew ? '_new' : '')}
            date={fixtureDate}
            showPlayers={showPlayers}
            startAddNote={startAddNote}
            setEditNote={setEditNote}
            setShowPlayers={setShowPlayers}
            setNewFixtures={setNewFixtures}
            onTournamentChanged={onTournamentChanged}
        />);
    }

    function getNewFixtureDate(date, isKnockout) {
        const seasonalTeams = teams.filter(t => {
            return t.seasons.filter(ts => ts.seasonId === season.id && ts.divisionId === divisionId).length > 0;
        });

        return {
            isNew: true,
            isKnockout: isKnockout,
            date: date,
            fixtures: seasonalTeams.map(team => {
                return {
                    id: team.id,
                    homeTeam: {
                        id: team.id,
                        name: team.name,
                        address: team.address,
                    },
                    awayTeam: null,
                    isKnockout: isKnockout,
                    accoladesCount: true,
                    fixturesUsingAddress: [],
                };
            }),
            tournamentFixtures: seasonalTeams.map(team => {
                return {
                    address: team.address,
                    proposed: true,
                };
            }),
            notes: [],
        };
    }

    function startAddNote(date) {
        setEditNote({
            date: date,
            divisionId: divisionId,
            seasonId: season.id,
        });
    }

    function renderEditNote() {
        return (<EditNote
            note={editNote}
            onNoteChanged={setEditNote}
            onClose={() => setEditNote(null)}
            onSaved={async () => {
                setNewDate('');
                setEditNote(null);
                await onReloadDivision();
            }}/>);
    }

    function scrollFixtureDateIntoView(date) {
        // setup scroll to fixture
        window.setTimeout(() => {
            /* istanbul ignore next */
            const newFixtureDateElement = document.querySelector(`div[data-fixture-date="${date}"]`);
            /* istanbul ignore next */
            if (newFixtureDateElement) {
                /* istanbul ignore next */
                newFixtureDateElement.scrollIntoView();
            }
        }, 100);
    }

    function addNewDate() {
        if (!newDate) {
            window.alert('Select a date first');
            return;
        }

        const utcDate = newDate + 'T00:00:00';

        try {
            if (any(fixtures, fd => fd.date === utcDate)) {
                return;
            }

            const newFixtureDate = getNewFixtureDate(utcDate, isKnockout);
            setNewFixtures(fixtures.concat([newFixtureDate]).sort(sortBy('date')));
        } finally {
            scrollFixtureDateIntoView(utcDate);
            setNewDateDialogOpen(false);
        }
    }

    function renderNewDateDialog() {
        return (<Dialog title="Add a date to the season" slim={true}>
            <div className="pb-2">
                <span className="margin-right">Select date:</span>
                <input type="date" min={season.startDate.substring(0, 10)} max={season.endDate.substring(0, 10)}
                       className="margin-right" value={newDate} onChange={stateChanged(setNewDate)}/>

                <div className="form-check form-switch d-inline-block">
                    <input type="checkbox" className="form-check-input" name="isKnockout" id="isKnockout"
                           checked={isKnockout} onChange={stateChanged(setIsKnockout)}/>
                    <label className="form-check-label" htmlFor="isKnockout">Qualifier</label>
                </div>
            </div>
            <div className="modal-footer px-0 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={() => setNewDateDialogOpen(false)}>Close</button>
                </div>
                <button className="btn btn-primary" onClick={addNewDate}>Add date</button>
            </div>
        </Dialog>);
    }

    function applyFixtureFilters(fixtureDate, fixtureFilters) {
        const filteredFixtureDate = Object.assign({}, fixtureDate);
        filteredFixtureDate.tournamentFixtures = fixtureDate.tournamentFixtures.filter(f => fixtureFilters.apply({
            date: fixtureDate.date,
            fixture: null,
            tournamentFixture: f
        }));
        const hasFixtures = any(fixtureDate.fixtures, f => f.id !== f.homeTeam.id);
        filteredFixtureDate.fixtures = (!isAdmin && !hasFixtures)
            ? []
            : fixtureDate.fixtures.filter(f => fixtureFilters.apply({
                date: fixtureDate.date,
                fixture: f,
                tournamentFixture: null
            }));

        return filteredFixtureDate;
    }

    try {
        const fixtureDateFilters = getFixtureDateFilters(filter, {}, fixtures);
        const fixtureFilters = getFixtureFilters(filter);
        const resultsToRender = fixtures
            .filter(fd => fixtureDateFilters.apply(fd))
            .map(fd => applyFixtureFilters(fd, fixtureFilters))
            .filter(fd => fixtureDateFilters.apply(fd)) // for any post-fixture filtering, e.g. notes=only-with-fixtures
            .map(renderFixtureDate);
        return (<div className="content-background p-3">
            {controls
                ? (<FilterFixtures
                    setFilter={(newFilter) => changeFilter(newFilter, setFilter, navigate, location)}
                    filter={filter}/>)
                : null}
            {isAdmin && newDateDialogOpen ? renderNewDateDialog() : null}
            <div>
                {resultsToRender}
                {isEmpty(resultsToRender, f => f != null) && any(fixtures) ? (
                    <div>No fixtures match your search</div>) : null}
                {isEmpty(fixtures) ? (<div>No fixtures, yet</div>) : null}
                {editNote ? renderEditNote() : null}
            </div>
            {isAdmin && createFixturesDialogOpen ? (
                <CreateSeasonDialog seasonId={season.id} onClose={() => setCreateFixturesDialogOpen(false)}/>) : null}
            {isAdmin ? (<div className="mt-3">
                <button className="btn btn-primary margin-right" onClick={() => setNewDateDialogOpen(true)}>
                    ➕ Add date
                </button>
                <button className="btn btn-primary margin-right" onClick={() => setCreateFixturesDialogOpen(true)}>
                    🗓️ Create fixtures
                </button>
            </div>) : null}
        </div>);
    } catch (exc) {
        /* istanbul ignore next */
        onError(exc);
    }
}
