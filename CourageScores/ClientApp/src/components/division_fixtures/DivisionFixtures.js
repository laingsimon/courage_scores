import React, {useEffect, useState} from 'react';
import {DivisionFixture} from "./DivisionFixture";
import {NewFixtureDate} from "./NewFixtureDate";
import {Dialog} from "../common/Dialog";
import {SeasonApi} from "../../api/season";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ProposeGamesDialog} from "./ProposeGamesDialog";
import {GameApi} from "../../api/game";
import {TournamentFixture} from "./TournamentFixture";
import {NewTournamentGame} from "./NewTournamentGame";
import {FilterFixtures} from "./FilterFixtures";
import {AndFilter, Filter, OrFilter} from "../Filter";

export function DivisionFixtures({ divisionId, account, onReloadDivision, teams, fixtures, season, setNewFixtures, allTeams }) {
    const isAdmin = account && account.access && account.access.manageGames;
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
    const [ filter, setFilter ] = useState({});
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
            allTeams={allTeams}
            seasonId={season.id}
            divisionId={divisionId}
            account={account}
            fixture={newFixture}
            date={newDate}
            allowTeamDelete={false}
            allowTeamEdit={false}
            isKnockout={isKnockout} />);
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

    async function onTournamentChanged() {
        const divisionData = await onReloadDivision();
        setNewFixtures(divisionData.fixtures);
        setNewDate('');
    }

    function isInPast(date) {
        const today = new Date();
        return new Date(date) < today;
    }

    function isInFuture(date) {
        const today = new Date();
        return new Date(date) > today;
    }

    function isToday(date) {
        const today = new Date().toDateString();
        return today === new Date(date).toDateString();
    }

    function hasProposals(fixtures) {
        return fixtures.filter(f => f.proposal).length > 0;
    }

    function isLastFixtureBeforeToday(date) {
        if (!renderContext.lastFixtureDateBeforeToday) {
            const dates = fixtures.map(f => f.date).filter(isInPast);
            // Assumes all dates are sorted
            if (dates.length > 0) {
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
        const filters = [];

        switch (filter.date) {
            case 'past':
                filters.push(new Filter(c => isInPast(c.date)));
                break;
            case 'future':
                filters.push(new Filter(c => isInFuture(c.date)));
                break;
            case 'last+next':
                filters.push(new OrFilter([
                    new Filter(c => isToday(c.date)),
                    new Filter(c => isLastFixtureBeforeToday(c.date)),
                    new Filter(c => isNextFeatureAfterToday(c.date))
                ]));
                break;
            default:
                break;
        }

        switch (filter.type) {
            case 'league':
                filters.push(new Filter(c => c.tournamentFixture === false && c.fixture.isKnockout === false));
                break;
            case 'knockout':
                filters.push(new Filter(c => c.fixture.isKnockout === true));
                break;
            case 'tournament':
                filters.push(new Filter(c => c.tournamentFixture === true));
                break;
            default:
                break;
        }

        if (filter.teamId) {
            filters.push(new OrFilter([
                new Filter(c => c.fixture.homeTeam && c.fixture.homeTeam.id === filter.teamId),
                new Filter(c => c.fixture.awayTeam && c.fixture.awayTeam.id === filter.teamId)
            ]));
        }

        return new AndFilter(filters);
    }

    function renderFixtureDate(date) {
        const filters = getFilters();
        const fixtures = date.fixtures.filter(f => filters.apply({ date: date.date, fixture: f, tournamentFixture: false }));
        const tournamentFixtures = date.tournamentFixtures.filter(f => filters.apply({ date: date.date, fixture: f, tournamentFixture: true }));

        if (fixtures.length === 0 && tournamentFixtures.length === 0) {
            return null;
        }

        return (<div key={date.date} className={isToday(date.date) ? 'text-primary' : (isInPast(date.date) || hasProposals(date.fixtures) ? '' : 'opacity-50')}>
            <h4>{new Date(date.date).toDateString()}{date.hasKnockoutFixture ? (<span> (knockout)</span>) : null}</h4>
            <table className="table layout-fixed">
                <tbody>
                {fixtures.map(f => (<DivisionFixture
                    key={f.id}
                    teams={teams}
                    allTeams={allTeams}
                    fixtures={fixtures}
                    divisionId={divisionId}
                    seasonId={season.id}
                    onReloadDivision={onReloadDivision}
                    account={account}
                    fixture={f}
                    readOnly={proposingGames}
                    date={date.date}
                    allowTeamDelete={false}
                    allowTeamEdit={false}
                    isKnockout={f.isKnockout} />))}
                {tournamentFixtures.map(tournament => (<TournamentFixture
                    key={tournament.address + '-' + tournament.date}
                    tournament={tournament}
                    account={account}
                    date={date.date}
                    seasonId={season.id}
                    divisionId={divisionId}
                    onTournamentChanged={onTournamentChanged} />))}
                </tbody>
            </table>
        </div>);
    }

    const renderContext = {};
    return (<div className="light-background p-3">
        <FilterFixtures setFilter={setFilter} filter={filter} teams={teams} />
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
            {fixtures.map(renderFixtureDate)}
            {fixtures.length === 0 ? (<div>No fixtures, yet</div>) : null}
        </div>
        {isAdmin && !proposingGames ? (<div className="mt-3">
            <div>
                <span className="margin-right">New fixture:</span>
                <input type="date" min={season.startDate.substring(0, 10)} max={season.endDate.substring(0, 10)} className="margin-right" value={newDate} onChange={(event) => setNewDate(event.target.value)} />

                <div className="form-check form-switch d-inline-block">
                    <input type="checkbox" className="form-check-input" name="knockout" id="knockout" checked={isKnockout} onChange={(event) => setIsKnockout(event.target.checked)} />
                    <label className="form-check-label" htmlFor="knockout">Knockout fixture</label>
                </div>
            </div>
            {newDate ? (<table className="table layout-fixed">
                <tbody>
                    {teams.map(t => (renderNewFixture(t)))}
                    <NewFixtureDate isKnockout={isKnockout} fixtures={fixtures} teams={teams} onNewTeam={onReloadDivision} date={newDate} divisionId={divisionId} seasonId={season.id} />
                    {isKnockout || fixtures.filter(f => f.date === newDate).fixtures ? null : (<NewTournamentGame date={newDate} onNewTournament={onTournamentChanged} teams={teams} divisionId={divisionId} seasonId={season.id} />)}
                </tbody>
            </table>) : null}
        </div>) : null}
    </div>);
}
