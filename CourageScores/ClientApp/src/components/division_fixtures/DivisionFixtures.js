import React, {useEffect, useState} from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./NewFixtureDate";
import {Dialog} from "../common/Dialog";
import {ProposeGamesDialog} from "./ProposeGamesDialog";
import {NewTournamentGame} from "./NewTournamentGame";
import {FilterFixtures} from "./FilterFixtures";
import {useLocation, useNavigate} from "react-router-dom";
import {EditNote} from "./EditNote";
import {any, isEmpty, stateChanged} from "../../Utilities";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {DivisionFixtureDate} from "./DivisionFixtureDate";

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
        logLevel: 'Warning',
        maxConsecutiveHomeOrAwayFixtures: 3
    });
    const [ proposalResponse, setProposalResponse ] = useState(null);
    const [ proposalSettingsDialogVisible, setProposalSettingsDialogVisible ] = useState(false);
    const [ savingProposals, setSavingProposals ] = useState(null);
    const [ cancelSavingProposals, setCancelSavingProposals ] = useState(false);
    const [ filter, setFilter ] = useState(initFilter());
    const [ editNote, setEditNote ] = useState(null);
    const [ showPlayers, setShowPlayers ] = useState(getPlayersToShow());
    const { seasonApi, gameApi } = useDependencies();

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

    function renderFixtureDate(date) {
        return (<DivisionFixtureDate
            date={date}
            filter={filter}
            renderContext={renderContext}
            proposingGames={proposingGames}
            showPlayers={showPlayers}
            startAddNote={startAddNote}
            setEditNote={setEditNote}
            setShowPlayers={setShowPlayers}
            setNewFixtures={setNewFixtures}
            onTournamentChanged={onTournamentChanged}
        />);
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
