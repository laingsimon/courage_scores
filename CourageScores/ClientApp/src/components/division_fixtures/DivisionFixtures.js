import React, { useState } from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./scores/NewFixtureDate";
import {Dialog} from "../common/Dialog";
import {SeasonApi} from "../../api/season";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";

export function DivisionFixtures({ divisionId, account, onReloadDivision, teams, fixtures, season, onNewTeam }) {
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
    const [ newFixtures, setNewFixtures ] = useState(fixtures);
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

    function updateProposalSettings(event) {
        const newProposalSettings = Object.assign({}, proposalSettings);
        newProposalSettings[event.target.name] = event.target.value;
        setProposalSettings(newProposalSettings);
    }

    function updateNewExclusion(event) {
        const newProposalSettings = Object.assign({}, proposalSettings);
        newProposalSettings.newExclusion[event.target.name] = event.target.value;
        setProposalSettings(newProposalSettings);
    }

    function addDateExclusion() {
        if (!proposalSettings.newExclusion.date) {
            window.alert('Enter a date first');
            return;
        }

        const newProposalSettings = Object.assign({}, proposalSettings);
        const newExclusion = newProposalSettings.newExclusion;
        newProposalSettings.newExclusion = { date: '' };
        newProposalSettings.excludedDates[newExclusion.date] = 'unspecified';
        setProposalSettings(newProposalSettings);
    }

    function removeDateExclusion(date) {
        const newProposalSettings = Object.assign({}, proposalSettings);
        delete newProposalSettings.excludedDates[date];
        setProposalSettings(newProposalSettings);
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

    async function saveProposals() {
        window.alert('Not implemented');
    }

    function renderProposalSettings() {
        let index = 0;

        function renderValidationErrors(errors) {
            return (<ol className="text-danger">
                {Object.keys(errors).map(key => {
                    return (<li key={key}>{key} {errors[key].map(e => (<p key={index++}>{e}</p>))}</li>)
                })}
            </ol>)
        }

        return (<div className="text-black"><Dialog title="Propose games...">
            <div>
                <div className="input-group my-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Number of legs</span>
                    </div>
                    <select disabled={proposingGames} value={proposalSettings.numberOfLegs} onChange={updateProposalSettings} name="numberOfLegs">
                        <option value="1">Single leg</option>
                        <option value="2">Two legs</option>
                    </select>
                </div>
                <div className="input-group my-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Day of week</span>
                    </div>
                    <select disabled={proposingGames} value={proposalSettings.weekDay} onChange={updateProposalSettings} name="weekDay">
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                    </select>
                </div>
                <div className="px-4">
                    <h6>Excluded dates</h6>
                    {Object.keys(proposalSettings.excludedDates).map(date => (<div key={date}>
                        <span className="margin-right">{new Date(date).toDateString()}</span>
                        <button disabled={proposingGames} className="btn btn-sm btn-danger" onClick={() => removeDateExclusion(date)}>🗑</button>
                    </div>))}
                    <div className="input-group my-2">
                        <div className="input-group-prepend">
                            <span className="input-group-text">Date</span>
                        </div>
                        <input disabled={proposingGames} type="date" value={proposalSettings.newExclusion.date} name="date" onChange={updateNewExclusion} className="margin-right" />
                        <button disabled={proposingGames} className="btn btn-sm btn-primary" onClick={addDateExclusion}>+</button>
                    </div>
                </div>
                <div className="input-group my-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Show</span>
                    </div>
                    <select disabled={proposingGames} name="logLevel" value={proposalSettings.logLevel} onChange={updateProposalSettings}>
                        <option value="Information">Everything</option>
                        <option value="Warning">Warnings and Errors</option>
                        <option value="Error">Errors only</option>
                    </select>
                </div>
            </div>
            {proposalResponse ? (<div className="overflow-auto max-scroll-height"><ul>
                {proposalResponse.errors && proposalResponse.errors.length ? proposalResponse.errors.map(e => (<li key={index++} className="text-danger">{e}</li>)) : null}
                {proposalResponse.errors && !proposalResponse.errors.length ? (renderValidationErrors(proposalResponse.errors)): null}
                {proposalResponse.warnings ? proposalResponse.warnings.map(w => (<li key={index++} className="text-warning">{w}</li>)) : null}
                {proposalResponse.messages ? proposalResponse.messages.map(m => (<li key={index++} className="text-primary">{m}</li>)) : null}
            </ul></div>) : null}
            <div className="text-end">
                <button className="btn btn-success margin-right" onClick={proposeFixtures}>
                    {proposingGames ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🎲'}
                    Propose Games...
                </button>
                <button disabled={proposingGames} className="btn btn-primary margin-right" onClick={() => { if (!proposingGames) { setProposalSettingsDialogVisible(false) } }}>Close</button>
            </div>
        </Dialog></div>)
    }

    return (<div className="light-background p-3">
        {proposalSettingsDialogVisible ? renderProposalSettings() : null}
        {isAdmin ? (<div className="mb-3">
            <span className="margin-right">Admin tools:</span>
            <button className="btn btn-primary margin-right" onClick={beginProposeFixtures}>
                🎲 Propose games...
            </button>
            {proposalResponse ? (<button className="btn btn-success" onClick={saveProposals}>
                💾 Save proposals...
            </button>) : null}
        </div>) : null}
        <div>
            {newFixtures.map(date => (<div key={date.date}>
                <h4>{new Date(date.date).toDateString()}</h4>
                <table className="table layout-fixed">
                    <tbody>
                    {date.fixtures.map(f => (<DivisionFixture
                        key={f.id}
                        teams={teams}
                        fixtures={newFixtures}
                        divisionId={divisionId}
                        seasonId={season.id}
                        onReloadDivision={onReloadDivision}
                        account={account}
                        fixture={f}
                        readOnly={proposingGames}
                        date={date.date}
                        allowTeamDelete={false}
                        allowTeamEdit={false} />))}
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
                    <NewFixtureDate fixtures={newFixtures} teams={teams} onNewTeam={onNewTeam} date={newDate} divisionId={divisionId} seasonId={season.id} />
                </tbody>
            </table>) : null}
        </div>) : null}
    </div>);
}
