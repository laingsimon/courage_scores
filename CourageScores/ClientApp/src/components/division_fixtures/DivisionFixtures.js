import React, { useState } from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./scores/NewFixtureDate";
import {Dialog} from "../common/Dialog";
import {SeasonApi} from "../../api/season";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ProposeGamesDialog} from "./ProposeGamesDialog";

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

    return (<div className="light-background p-3">
        {proposalSettingsDialogVisible ? (<ProposeGamesDialog
            onPropose={proposeFixtures}
            onClose={() => setProposalSettingsDialogVisible(false)}
            proposalSettings={proposalSettings}
            disabled={proposingGames}
            proposalResponse={proposalResponse}
            onUpdateProposalSettings={settings => setProposalSettings(settings)} />) : null}
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
