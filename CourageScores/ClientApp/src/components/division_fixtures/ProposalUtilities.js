import {any, isEmpty} from "../../Utilities";
import React from "react";
import {Dialog} from "../common/Dialog";

export function beginProposeFixtures({ proposalSettings, setProposalSettings, fixtures, setProposalSettingsDialogVisible }) {
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

export async function proposeFixtures({ setProposingGames, setProposalResponse, seasonApi, proposalSettings, setProposalSettingsDialogVisible, setNewFixtures }) {
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

export async function saveProposal({ savingProposals, gameApi, divisionId, season, setSavingProposals, onReloadDivision, setProposalResponse }) {
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
                await onProposalsSaved({ setProposalResponse, onReloadDivision, setSavingProposals });
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

export async function onProposalsSaved({ setProposalResponse, onReloadDivision, setSavingProposals }) {
    setProposalResponse(null);
    await onReloadDivision();
    setSavingProposals(null);
}

export async function saveProposals({ proposalResponse, setCancelSavingProposals, setSavingProposals }) {
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

export function startCreatingProposals({ savingProposals, setSavingProposals }) {
    const newSavingProposals = Object.assign({}, savingProposals);
    newSavingProposals.started = true;
    setSavingProposals(newSavingProposals);
}

export function renderSavingProposalsDialog(proposalContext) {
    let index = 0;
    const savingProposals = proposalContext.savingProposals;
    const cancelSavingProposals = proposalContext.cancelSavingProposals;
    const setCancelSavingProposals = proposalContext.setCancelSavingProposals;
    const onReloadDivision = proposalContext.onReloadDivision;
    const setSavingProposals = proposalContext.setSavingProposals;
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
            {cancelSavingProposals || savingProposals.started ? null : (<button className="btn btn-success margin-right" onClick={() => startCreatingProposals(proposalContext)}>Start</button>)}
        </div>
    </Dialog>);
}