import React, {useEffect, useState} from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./NewFixtureDate";
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
import {changeFilter, initFilter} from "./FilterUtilities";
import {
    beginProposeFixtures,
    proposeFixtures,
    renderSavingProposalsDialog,
    saveProposal,
    saveProposals
} from "./ProposalUtilities";

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
    const [ filter, setFilter ] = useState(initFilter(location));
    const [ editNote, setEditNote ] = useState(null);
    const [ showPlayers, setShowPlayers ] = useState(getPlayersToShow());
    const { seasonApi, gameApi } = useDependencies();
    const proposalContext = {
        proposalSettings,
        setProposalSettings,
        fixtures,
        setProposalSettingsDialogVisible,
        setProposingGames,
        setProposalResponse,
        seasonApi,
        gameApi,
        setNewFixtures,
        savingProposals,
        divisionId,
        season,
        setSavingProposals,
        onReloadDivision,
        cancelSavingProposals,
        setCancelSavingProposals,
        proposalResponse
    };

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
            isKnockout={isKnockout} />);
    }

    useEffect(() => {
        if (!proposalContext.savingProposals || proposalContext.cancelSavingProposals || proposalContext.savingProposals.complete || !proposalContext.savingProposals.proposals) {
            return;
        }

        if (proposalContext.savingProposals.started) {
            // noinspection JSIgnoredPromiseFromCall
            saveProposal(...proposalContext);
        }
    },
        // eslint-disable-next-line
        [ savingProposals, cancelSavingProposals ]);

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
            <FilterFixtures setFilter={(newFilter) => changeFilter(newFilter, setFilter, navigate, location)} filter={filter}/>
            {proposalSettingsDialogVisible ? (<ProposeGamesDialog
                onPropose={() => proposeFixtures(...proposalContext)}
                onClose={() => setProposalSettingsDialogVisible(false)}
                proposalSettings={proposalSettings}
                disabled={proposingGames}
                proposalResponse={proposalResponse}
                onUpdateProposalSettings={setProposalSettings}/>) : null}
            {savingProposals ? renderSavingProposalsDialog(proposalContext) : null}
            {isAdmin ? (<div className="mb-3">
                <button className="btn btn-primary margin-right" onClick={() => beginProposeFixtures(proposalContext)}>
                    🎲 Propose games...
                </button>
                {proposalResponse && any(proposals) ? (
                    <button className="btn btn-success" onClick={() => saveProposals(...proposalContext)}>
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
