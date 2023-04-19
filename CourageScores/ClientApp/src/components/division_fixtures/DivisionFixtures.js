import React, {useEffect, useState} from 'react';
import {ProposeGamesDialog} from "./ProposeGamesDialog";
import {FilterFixtures} from "./FilterFixtures";
import {useLocation, useNavigate} from "react-router-dom";
import {EditNote} from "./EditNote";
import {any, isEmpty, sortBy, stateChanged} from "../../Utilities";
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
import {Dialog} from "../common/Dialog";

export function DivisionFixtures({ setNewFixtures }) {
    const { id: divisionId, season, fixtures, teams, onReloadDivision } = useDivisionData();
    const navigate = useNavigate();
    const location = useLocation();
    const { account, onError } = useApp();
    const isAdmin = account && account.access && account.access.manageGames;
    const [ newDate, setNewDate ] = useState('');
    const [ newDateDialogOpen, setNewDateDialogOpen ] = useState(false);
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

    function renderFixtureDate(fixtureDate) {
        return (<DivisionFixtureDate
            key={fixtureDate.date + (fixtureDate.isNew ? '_new' : '')}
            date={fixtureDate}
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

    function getNewFixtureDate(date) {
        return {
            isNew: true,
            date: date,
            fixtures: teams.map(team => {
                return {
                    id: team.id,
                    homeTeam: {
                        id: team.id,
                        name: team.name,
                        address: team.address,
                    },
                    awayTeam: null,
                };
            }),
            tournamentFixtures: teams.map(team => {
                return {
                    address: team.name,
                    proposed: true,
                };
            }),
            notes: []
        };
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

    function scrollFixtureDateIntoView(date) {
        // setup scroll to fixture
        window.setTimeout(() => {
            const newFixtureDateElement = document.querySelector(`div[data-fixture-date="${date}"]`);
            if (newFixtureDateElement) {
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

            const newFixtureDate = getNewFixtureDate(utcDate);
            setNewFixtures(fixtures.concat([newFixtureDate]).sort(sortBy('date')));
        } finally {
            scrollFixtureDateIntoView(utcDate);
            setNewDateDialogOpen(false);
        }
    }

    function renderNewDateDialog() {
        return (<Dialog title="Add a date to the season" slim={true}>
            <div>
                <span className="margin-right">Select date:</span>
                <input type="date" min={season.startDate.substring(0, 10)} max={season.endDate.substring(0, 10)}
                       className="margin-right" value={newDate} onChange={stateChanged(setNewDate)}/>

                <div className="form-check form-switch d-inline-block">
                    <input type="checkbox" className="form-check-input" name="isKnockout" id="isKnockout"
                           checked={isKnockout} onChange={stateChanged(setIsKnockout)}/>
                    <label className="form-check-label" htmlFor="isKnockout">Qualifier</label>
                </div>
            </div>
            <div className="mt-3 text-end">
                <button className="btn btn-primary margin-right" onClick={addNewDate}>Add date</button>
                <button className="btn btn-primary" onClick={() => setNewDateDialogOpen(false)}>Close</button>
            </div>
        </Dialog>);
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
            {isAdmin && newDateDialogOpen && !proposingGames ? renderNewDateDialog() : null}
            {savingProposals ? renderSavingProposalsDialog(proposalContext) : null}
            {isAdmin ? (<div className="mb-3">
                <button className="btn btn-primary margin-right" onClick={() => beginProposeFixtures(proposalContext)}>
                    🎲 Propose games...
                </button>
                {proposalResponse && any(proposals) ? (
                    <button className="btn btn-success" onClick={() => saveProposals(...proposalContext)}>
                        💾 Save proposals...
                    </button>) : null}
                <button className="btn btn-primary" onClick={() => setNewDateDialogOpen(true)}>➕ Add date</button>
            </div>) : null}
            <div>
                {resultsToRender}
                {isEmpty(resultsToRender, f => f != null) && any(fixtures) ? (
                    <div>No fixtures match your search</div>) : null}
                {isEmpty(fixtures) ? (<div>No fixtures, yet</div>) : null}
                {editNote ? renderEditNote() : null}
            </div>
            {isAdmin ? (<div className="mt-3">
                <button className="btn btn-primary" onClick={() => setNewDateDialogOpen(true)}>➕ Add date</button>
            </div>) : null}
        </div>);
    } catch (exc) {
        onError(exc);
    }
}
