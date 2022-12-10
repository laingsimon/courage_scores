import React, {useEffect, useState} from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./NewFixtureDate";
import {Dialog} from "../common/Dialog";
import {SeasonApi} from "../../api/season";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ProposeGamesDialog} from "./ProposeGamesDialog";
import {GameApi} from "../../api/game";
import {KnockoutFixture} from "./KnockoutFixture";
import {NewKnockoutGame} from "./NewKnockoutGame";

export function DivisionFixtures({ divisionId, account, onReloadDivision, teams, fixtures, season, setNewFixtures }) {
    const isAdmin = account && account.access && account.access.manageGames;
    const [ newDate, setNewDate ] = useState('');
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
    const seasonApi = new SeasonApi(new Http(new Settings()));

    async function onNewDateCreated() {
        setNewDate('');
        if (onReloadDivision) {
            await onReloadDivision();
        }
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
            onReloadDivision={onNewDateCreated}
            fixtures={fixtures}
            teams={teams}
            seasonId={season.id}
            divisionId={divisionId}
            account={account}
            fixture={newFixture}
            date={newDate}
            allowTeamDelete={false}
            allowTeamEdit={false} />);
    }

    function beginProposeFixtures() {
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
                if (!response.messages.length && !response.warnings.length && !response.errors.length) {
                    setProposalSettingsDialogVisible(false);
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
            const api = new GameApi(new Http(new Settings()));
            const fixture = savingProposals.proposals[index];

            const result = await api.update({
                id: fixture.id,
                address: fixture.homeTeam.address,
                date: fixture.date,
                divisionId: divisionId,
                homeTeamId: fixture.homeTeam.id,
                awayTeamId: fixture.awayTeam.id,
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
                    await onReloadDivision();
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

    useEffect(() => {
        if (!savingProposals || cancelSavingProposals || savingProposals.complete || !savingProposals.proposals) {
            return;
        }

        if (savingProposals.started) {
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

        return (<Dialog title="Creating games...">
            {!cancelSavingProposals && !savingProposals.complete && currentProposal ? (<p>{new Date(currentProposal.date).toDateString()}: <strong>{currentProposal.homeTeam.name}</strong> vs <strong>{currentProposal.awayTeam.name}</strong></p>) : null}
            {savingProposals.started
                ? (<p>{cancelSavingProposals || savingProposals.complete ? 'Created' : 'Creating'}: {savingProposals.saved} of {savingProposals.proposals.length}</p>)
                : (<p>About to create <strong>{savingProposals.proposals.length}</strong> games, click Start to create them</p>)}
            {cancelSavingProposals ? (<p className="text-danger">Operation cancelled.</p>) : null}
            <div className="progress" style={{ height: '25px' }}>
                <div className={`progress-bar ${cancelSavingProposals ? ' bg-danger' : ' bg-success progress-bar-striped progress-bar-animated'}`} role="progressbar" style={{ width: `${percentage}%`}}>{percentage.toFixed(0)}%</div>
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

    async function onKnockoutChanged() {
        const divisionData = await onReloadDivision();
        setNewFixtures(divisionData.fixtures);
        setNewDate('');
    }

    function isInPast(date) {
        const today = new Date();
        return new Date(date) < today;
    }

    function isToday(date) {
        const today = new Date().toDateString();
        return today === new Date(date).toDateString();
    }

    return (<div className="light-background p-3">
        {proposalSettingsDialogVisible ? (<ProposeGamesDialog
            onPropose={proposeFixtures}
            onClose={() => setProposalSettingsDialogVisible(false)}
            proposalSettings={proposalSettings}
            disabled={proposingGames}
            proposalResponse={proposalResponse}
            onUpdateProposalSettings={settings => setProposalSettings(settings)} />) : null}
        {savingProposals ? renderSavingProposalsDialog() : null}
        {isAdmin ? (<div className="mb-3">
            <button className="btn btn-primary margin-right" onClick={beginProposeFixtures}>
                🎲 Propose games...
            </button>
            {proposalResponse ? (<button className="btn btn-success" onClick={saveProposals}>
                💾 Save proposals...
            </button>) : null}
        </div>) : null}
        <div>
            {fixtures.map(date => (<div key={date.date} className={isToday(date.date) ? 'text-primary' : (isInPast(date.date) ? '' : 'text-secondary')}>
                <h4>{new Date(date.date).toDateString()}</h4>
                <table className="table layout-fixed">
                    <tbody>
                    {date.fixtures.map(f => (<DivisionFixture
                        key={f.id}
                        teams={teams}
                        fixtures={fixtures}
                        divisionId={divisionId}
                        seasonId={season.id}
                        onReloadDivision={onReloadDivision}
                        account={account}
                        fixture={f}
                        readOnly={proposingGames}
                        date={date.date}
                        allowTeamDelete={false}
                        allowTeamEdit={false} />))}
                    {date.knockoutFixtures.map(kf => (<KnockoutFixture
                        key={kf.address}
                        knockout={kf}
                        account={account}
                        date={date.date}
                        seasonId={season.id}
                        divisionId={divisionId}
                        onKnockoutChanged={onKnockoutChanged} />))}
                    </tbody>
                </table>
            </div>))}
        </div>
        {isAdmin && !proposingGames ? (<div className="mt-3">
            <div>
                <span className="margin-right">New fixture:</span>
                <input type="date" min={season.startDate.substring(0, 10)} max={season.endDate.substring(0, 10)} className="margin-right" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
            </div>
            {newDate ? (<table className="table layout-fixed">
                <tbody>
                    {teams.map(t => (renderNewFixture(t)))}
                    <NewFixtureDate fixtures={fixtures} teams={teams} onNewTeam={onReloadDivision} date={newDate} divisionId={divisionId} seasonId={season.id} />
                    {fixtures.filter(f => f.date === newDate).fixtures ? null : (<NewKnockoutGame date={newDate} onNewKnockout={onKnockoutChanged} teams={teams} divisionId={divisionId} seasonId={season.id} />)}
                </tbody>
            </table>) : null}
        </div>) : null}
    </div>);
}
