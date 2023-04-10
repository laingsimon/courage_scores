import React, {useEffect, useState} from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./NewFixtureDate";
import {Dialog} from "../common/Dialog";
import {ProposeGamesDialog} from "./ProposeGamesDialog";
import {TournamentFixture} from "./TournamentFixture";
import {NewTournamentGame} from "./NewTournamentGame";
import {FilterFixtures} from "./FilterFixtures";
import {AndFilter, Filter, OrFilter, NotFilter, NullFilter} from "../Filter";
import {useLocation, useNavigate} from "react-router-dom";
import {EditNote} from "./EditNote";
import {any, isEmpty, stateChanged} from "../../Utilities";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";

export function DivisionFixtures({ setNewFixtures }) {
    const { id: divisionId, season, fixtures, teams, onReloadDivision } = useDivisionData();
    const navigate = useNavigate();
    const location = useLocation();
    const { account, onError } = useApp();
    const isAdmin = account && account.access && account.access.manageGames;
    const isNoteAdmin = account && account.access && account.access.manageNotes;
    const [ newDate, setNewDate ] = useState('');
    const [ isKnockout, setIsKnockout ] = useState(false);
    const [ proposingGames, setProposingGames ] = useState(false);
    const [ proposalSettings, setProposalSettings ] = useState({
        divisionId: divisionId,
        seasonId: season.id,
        teams: [ ],
        weekDay: 'Thursday',
        excludedDates: { },
        newExclusion: { date: '' },
        // frequencyDays: 7, not required as weekDay is provided
        numberOfLegs: 2,
        // startDate: "2022-01-01" // not required, use season start date
        logLevel: 'Warning'
    });
    const [ proposalResponse, setProposalResponse ] = useState(null);
    const [ proposalSettingsDialogVisible, setProposalSettingsDialogVisible ] = useState(false);
    const [ savingProposals, setSavingProposals ] = useState(null);
    const [ cancelSavingProposals, setCancelSavingProposals ] = useState(false);
    const [ filter, setFilter ] = useState(initFilter());
    const [ editNote, setEditNote ] = useState(null);
    const [ deletingNote, setDeletingNote ] = useState(false);
    const [ showPlayers, setShowPlayers ] = useState(getPlayersToShow());
    const { seasonApi, gameApi, noteApi } = useDependencies();

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

    function initFilter() {
        const search = new URLSearchParams(location.search);
        const filter = {};
        if (search.has('date')) {
            filter.date = search.get('date');
        }
        if (search.has('type')) {
            filter.type = search.get('type');
        }
        if (search.has('teamId')) {
            filter.teamId = search.get('teamId');
        }

        return filter;
    }

    function changeFilter(newFilter) {
        setFilter(newFilter);

        const search = Object.assign({}, newFilter);
        Object.keys(newFilter).forEach(key => {
            if (!newFilter[key]) {
                delete search[key];
            }
        })

        navigate({
            pathname: location.pathname,
            search: new URLSearchParams(search).toString(),
            hash: location.hash,
        });
    }

    function renderNewFixture(team) {
        const newFixture = {
            id: team.id,
            homeTeam: {
                id: team.id,
                name: team.name,
                address: team.address,
            },
            awayTeam: null,
        };

        return (<DivisionFixture
            key={team.id}
            beforeReloadDivision={() => setNewDate('')}
            fixture={newFixture}
            date={newDate}
            allowTeamDelete={false}
            allowTeamEdit={false}
            isKnockout={isKnockout} />);
    }

    function beginProposeFixtures() {
        // set proposalSettings.excludedDates
        if (isEmpty(Object.keys(proposalSettings.excludedDates))) {
            const datesWithNotes = {};
            fixtures.filter(fd => any(fd.notes)).map(fd => fd.date).forEach(date => datesWithNotes[date] = 'has a note');
            if (any(Object.keys(datesWithNotes))) {
                const newProposalSettings = Object.assign({}, proposalSettings);
                newProposalSettings.excludedDates = datesWithNotes;
                setProposalSettings(newProposalSettings);
            }
        }

        setProposalSettingsDialogVisible(true);
    }

    async function proposeFixtures() {
        setProposingGames(true);
        setProposalResponse(null);
        try {
            const response = await seasonApi.propose(proposalSettings);
            if (response.success) {
                setNewFixtures(response.result);

                setProposalResponse(response);
                const proposals = response.result.flatMap(date => date.fixtures).filter(f => f.proposal);
                if (any(proposals) && isEmpty(response.messages) && isEmpty(response.warnings) && isEmpty(response.errors)) {
                    setProposalSettingsDialogVisible(false);
                } else if (isEmpty(proposals)) {
                    window.alert('No fixtures proposed, maybe all fixtures already have been created?');
                }
            } else {
                setProposalResponse(response);
            }
        } finally {
            setProposingGames(false);
        }
    }

    async function saveProposal() {
        try {
            const index = savingProposals.saved;
            const fixture = savingProposals.proposals[index];

            const result = await gameApi.update({
                id: fixture.id,
                address: fixture.homeTeam.address,
                date: fixture.date,
                divisionId: divisionId,
                homeTeamId: fixture.homeTeam.id,
                awayTeamId: fixture.awayTeam.id,
                seasonId: season.id
            });

            window.setTimeout(async () => {
                const newSavingProposals = Object.assign({}, savingProposals);
                newSavingProposals.saved++;
                if (!result.success) {
                    newSavingProposals.messages.push(`Error saving proposal ${index + 1}: ${fixture.date}: ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
                }

                if (newSavingProposals.saved === newSavingProposals.proposals.length) {
                    newSavingProposals.complete = true;
                }

                setSavingProposals(newSavingProposals);

                if (newSavingProposals.complete) {
                    await onProposalsSaved();
                }
            }, 100);
        } catch (e) {
            const newSavingProposals = Object.assign({}, savingProposals);
            newSavingProposals.error = e.message;
            newSavingProposals.complete = true;
            await onReloadDivision();
            setSavingProposals(newSavingProposals);
        }
    }

    async function onProposalsSaved() {
        setProposalResponse(null);
        await onReloadDivision();
        setSavingProposals(null);
    }

    useEffect(() => {
        if (!savingProposals || cancelSavingProposals || savingProposals.complete || !savingProposals.proposals) {
            return;
        }

        if (savingProposals.started) {
            // noinspection JSIgnoredPromiseFromCall
            saveProposal();
        }
    },
        // eslint-disable-next-line
        [ savingProposals, cancelSavingProposals ]);

    async function saveProposals() {
        const proposals = [];
        proposalResponse.result.forEach(dateAndFixtures => {
            dateAndFixtures.fixtures.forEach(fixture => {
                if (fixture.proposal) {
                    proposals.push(Object.assign({}, fixture, {date: dateAndFixtures.date}));
                }
            });
        });

        setCancelSavingProposals(false);
        setSavingProposals({ proposals: proposals, saved: 0, messages: [], complete: false, error: null, started: false });
    }

    function startCreatingProposals() {
        const newSavingProposals = Object.assign({}, savingProposals);
        newSavingProposals.started = true;
        setSavingProposals(newSavingProposals);
    }

    function renderSavingProposalsDialog() {
        let index = 0;
        const percentage = (savingProposals.saved / savingProposals.proposals.length) * 100;
        const currentProposal = savingProposals.proposals[savingProposals.saved - 1];
        let progressBarColour = 'bg-primary progress-bar-animated progress-bar-striped';
        if (cancelSavingProposals) {
            progressBarColour = 'bg-danger';
        } else if (savingProposals.complete) {
            progressBarColour = 'bg-success';
        }

        return (<Dialog title="Creating games...">
            {!cancelSavingProposals && !savingProposals.complete && currentProposal ? (<p>{new Date(currentProposal.date).toDateString()}: <strong>{currentProposal.homeTeam.name}</strong> vs <strong>{currentProposal.awayTeam.name}</strong></p>) : null}
            {savingProposals.started
                ? (<p>{cancelSavingProposals || savingProposals.complete ? 'Created' : 'Creating'}: {savingProposals.saved} of {savingProposals.proposals.length}</p>)
                : (<p>About to create <strong>{savingProposals.proposals.length}</strong> games, click Start to create them</p>)}
            {cancelSavingProposals ? (<p className="text-danger">Operation cancelled.</p>) : null}
            <div className="progress" style={{ height: '25px' }}>
                <div className={`progress-bar ${progressBarColour}`} role="progressbar" style={{ width: `${percentage}%`}}>{percentage.toFixed(0)}%</div>
            </div>
            {savingProposals.error ? (<p className="text-danger">{savingProposals.error}</p>) : null}
            <ol className="overflow-auto max-scroll-height">
                {savingProposals.messages.map(message => (<li className="text-warning" key={index++}>{message}</li>))}
            </ol>
            <div>
                {cancelSavingProposals || savingProposals.complete || !savingProposals.started ? null : (<button className="btn btn-danger margin-right" onClick={async () => { setCancelSavingProposals(true); await onReloadDivision(); } }>Cancel</button>)}
                {cancelSavingProposals || !savingProposals.started || savingProposals.complete ? (<button className="btn btn-primary margin-right" onClick={() => setSavingProposals(null)}>Close</button>) : null}
                {cancelSavingProposals || savingProposals.started ? null : (<button className="btn btn-success margin-right" onClick={startCreatingProposals}>Start</button>)}
            </div>
        </Dialog>);
    }

    async function onTournamentChanged() {
        const divisionData = await onReloadDivision();
        setNewFixtures(divisionData.fixtures);
        setNewDate('');
    }

    function isInPast(date) {
        const today = new Date(new Date().toDateString());
        return new Date(date) < today;
    }

    function isInFuture(date) {
        const today = new Date(new Date().toDateString());
        const tomorrow = new Date(today.setDate(today.getDate() + 1));
        return new Date(date) >= tomorrow;
    }

    function isToday(date) {
        const today = new Date().toDateString();
        return today === new Date(date).toDateString();
    }

    function hasProposals(fixtures) {
        return any(fixtures, f => f.proposal);
    }

    function isLastFixtureBeforeToday(date) {
        if (!renderContext.lastFixtureDateBeforeToday) {
            const dates = fixtures.map(f => f.date).filter(isInPast);
            // Assumes all dates are sorted
            if (any(dates)) {
                renderContext.lastFixtureDateBeforeToday = dates[dates.length - 1];
            } else {
                renderContext.lastFixtureDateBeforeToday = 'no fixtures in past';
            }
        }

        return date === renderContext.lastFixtureDateBeforeToday;
    }

    function isNextFeatureAfterToday(date) {
        const inFuture = isInFuture(date);
        if (!inFuture) {
            return false;
        }

        if (!renderContext.futureDateShown) {
            renderContext.futureDateShown = date;
        }

        return renderContext.futureDateShown === date;
    }

    function getFilters() {
        return new AndFilter([
            optionallyInvertFilter(getDateFilter, filter.date),
            optionallyInvertFilter(getTypeFilter, filter.type),
            optionallyInvertFilter(getTeamIdFilter, filter.teamId)
        ]);
    }

    function optionallyInvertFilter(getFilter, filterInput) {
        if (filterInput && filterInput.indexOf('not(') === 0) {
            const withoutNot = filterInput.substring(4, filterInput.length - 1);
            const positiveFilter = getFilter(withoutNot);
            return positiveFilter
                ? new NotFilter(positiveFilter)
                : new NullFilter();
        }

        return getFilter(filterInput) ?? new NullFilter();
    }

    function getDateFilter(date) {
        switch (date) {
            case 'past':
                return new Filter(c => isInPast(c.date));
            case 'future':
                return new Filter(c => isInFuture(c.date));
            case 'last+next':
                return new OrFilter([
                    new Filter(c => isToday(c.date)),
                    new Filter(c => isLastFixtureBeforeToday(c.date)),
                    new Filter(c => isNextFeatureAfterToday(c.date))
                ]);
            default:
                if (filter.date && filter.date.match(/\d{4}-\d{2}/)) {
                    return new Filter(c => c.date.indexOf(filter.date) === 0);
                }

                return new NullFilter();
        }
    }

    function getTypeFilter(type) {
        switch (type) {
            case 'league':
                return new AndFilter([
                    new Filter(c => c.tournamentFixture === false),
                    new Filter(c => c.fixture.isKnockout === false)
                ]);
            case 'qualifier':
                return new Filter(c => c.fixture.isKnockout === true);
            case 'tournament':
                return new Filter(c => c.tournamentFixture === true);
            default:
                return new NullFilter();
        }
    }

    function getTeamIdFilter(teamId) {
        if (!teamId) {
            return new NullFilter();
        }

        return new OrFilter([
                new Filter(c => c.fixture.homeTeam && c.fixture.homeTeam.id === teamId),
                new Filter(c => c.fixture.awayTeam && c.fixture.awayTeam.id === teamId),
                new Filter(c => c.tournamentFixture && any(c.fixture.sides, s => s.teamId === teamId))
            ]);
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

    function renderFixtureDate(date) {
        const filters = getFilters();
        let fixturesForDate = (date.fixtures || []).filter(f => filters.apply({ date: date.date, fixture: f, tournamentFixture: false }));
        const tournamentFixturesForDate = (date.tournamentFixtures || []).filter(f => filters.apply({ date: date.date, fixture: f, tournamentFixture: true }));
        const notesForDate = date.notes;

        const hasFixtures = any(date.fixtures, f => f.id !== f.homeTeam.id);
        if (!isAdmin && !hasFixtures) {
            fixturesForDate = []; // no fixtures defined for this date, and not an admin so none can be defined, hide all the teams
        }

        if (isEmpty(fixturesForDate) && isEmpty(tournamentFixturesForDate) && isEmpty(notesForDate)) {
            return null;
        }

        return (<div key={date.date} className={isToday(date.date) ? 'text-primary' : (isInPast(date.date) || hasProposals(date.fixtures) ? '' : 'text-secondary-50')}>
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
            {notesForDate.map(renderNote)}
            <table className="table layout-fixed">
                <tbody>
                {fixturesForDate.map(f => (<DivisionFixture
                    key={f.id}
                    fixture={f}
                    readOnly={proposingGames}
                    date={date.date}
                    allowTeamDelete={false}
                    allowTeamEdit={false}
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

    function startAddNote(date) {
        if (!date) {
            window.alert('Select a date first');
            return;
        }

        setEditNote({
            date: date,
            divisionId: divisionId,
            seasonId: season.id,
        });
    }

    async function deleteNote(note) {
        if (deletingNote) {
            return;
        }

        if (!window.confirm('Are you sure you want to delete this note?')) {
            return;
        }

        setDeletingNote(true);
        try{
            const response = await noteApi.delete(note.id);

            if (response.success) {
                await onReloadDivision();
            } else {
                alert('Could not delete note');
            }
        }
        finally {
            setDeletingNote(false);
        }
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
            } }/>);
    }

    function renderNote(note) {
        return (<div className="alert alert-warning alert-dismissible fade show" role="alert" key={note.id}>
            <span className="margin-right">📌</span>
            {note.note}
            {isNoteAdmin ? (<button type="button" className="btn-close" data-dismiss="alert" aria-label="Close" onClick={() => deleteNote(note)}></button>) : null}
            {isNoteAdmin ? (<div className="mt-2">
                <button className="btn btn-sm btn-primary margin-right" onClick={() => setEditNote(note)}>Edit</button>
            </div>) : null}
        </div>);
    }

    const renderContext = {};
    try {
        const resultsToRender = fixtures.map(renderFixtureDate);
        const proposals = proposalResponse
            ? proposalResponse.result.flatMap(date => date.fixtures).filter(f => f.proposal)
            : [];
        return (<div className="light-background p-3">
            <FilterFixtures setFilter={changeFilter} filter={filter}/>
            {proposalSettingsDialogVisible ? (<ProposeGamesDialog
                onPropose={proposeFixtures}
                onClose={() => setProposalSettingsDialogVisible(false)}
                proposalSettings={proposalSettings}
                disabled={proposingGames}
                proposalResponse={proposalResponse}
                onUpdateProposalSettings={setProposalSettings}/>) : null}
            {savingProposals ? renderSavingProposalsDialog() : null}
            {isAdmin ? (<div className="mb-3">
                <button className="btn btn-primary margin-right" onClick={beginProposeFixtures}>
                    🎲 Propose games...
                </button>
                {proposalResponse && any(proposals) ? (
                    <button className="btn btn-success" onClick={saveProposals}>
                        💾 Save proposals...
                    </button>) : null}
            </div>) : null}
            <div>
                {resultsToRender}
                {isEmpty(resultsToRender, f => f != null) && any(fixtures) ? (
                    <div>No fixtures match your search</div>) : null}
                {isEmpty(fixtures) ? (<div>No fixtures, yet</div>) : null}
                {editNote ? renderEditNote() : null}
            </div>
            {isAdmin && !proposingGames ? (<div className="mt-3">
                <div>
                    <span className="margin-right">Select date:</span>
                    <input type="date" min={season.startDate.substring(0, 10)} max={season.endDate.substring(0, 10)}
                           className="margin-right" value={newDate} onChange={stateChanged(setNewDate)}/>

                    <div className="form-check form-switch d-inline-block">
                        <input type="checkbox" className="form-check-input" name="isKnockout" id="isKnockout"
                               checked={isKnockout} onChange={stateChanged(setIsKnockout)}/>
                        <label className="form-check-label" htmlFor="isKnockout">Qualifier</label>
                    </div>
                    {newDate && isNoteAdmin ? (
                        <button className="btn btn-primary btn-sm margin-left" onClick={() => startAddNote(newDate)}>📌
                            Add note</button>) : null}
                </div>
                {newDate ? (<table className="table layout-fixed">
                    <tbody>
                    {teams.map(t => (renderNewFixture(t)))}
                    <NewFixtureDate date={newDate}/>
                    {isKnockout || fixtures.filter(f => f.date === newDate).fixtures ? null : (
                        <NewTournamentGame date={newDate} onNewTournament={onTournamentChanged}/>)}
                    </tbody>
                </table>) : null}
            </div>) : null}
        </div>);
    } catch (exc) {
        onError(exc);
    }
}
