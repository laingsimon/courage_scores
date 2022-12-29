import React, {useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import {Settings} from "../../../api/settings";
import {GameApi} from "../../../api/game";
import {Http} from "../../../api/http";
import {TeamApi} from "../../../api/team";
import {MatchPlayerSelection, NEW_PLAYER} from "./MatchPlayerSelection";
import {PlayerSelection} from "../../division_players/PlayerSelection";
import {MultiPlayerSelection} from "./MultiPlayerSelection";
import {Link} from 'react-router-dom';
import {NavItem, NavLink} from "reactstrap";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {DivisionControls} from "../../DivisionControls";
import {SeasonApi} from "../../../api/season";
import {nameSort} from "../../../Utilities";
import {Loading} from "../../common/Loading";
import {MergeMatch} from "./MergeMatch";

export function Score({account, apis, divisions}) {
    const {fixtureId} = useParams();
    const [loading, setLoading] = useState('init');
    const [data, setData] = useState(null);
    const [fixtureData, setFixtureData] = useState(null);
    const [homeTeam, setHomeTeam] = useState([]);
    const [awayTeam, setAwayTeam] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [season, setSeason] = useState(null);
    const [division, setDivision] = useState(null);
    const [seasons, setSeasons] = useState(null);
    const [access, setAccess] = useState(null);
    const [submission, setSubmission] = useState(null);

    useEffect(() => {
        if (account && account.access) {
            if (account.access.manageScores) {
                setAccess('admin');
            } else if (account.teamId) {
                setAccess('clerk');
            }
        } else {
            setAccess('readonly');
        }
    }, [account]);

    useEffect(() => {
            if (loading !== 'init') {
                return;
            }

            setLoading('loading');
            loadFixtureData();
        },
        // eslint-disable-next-line
        [loading]);

    async function loadTeamPlayers(teamId, seasonId, teamType, matches) {
        const http = new Http(new Settings());
        const teamApi = new TeamApi(http);
        const teamData = await teamApi.get(teamId);

        if (!teamData) {
            setError(`${teamType} team could not be found`);
            return;
        }

        if (!teamData.seasons) {
            setError(`${teamType} team has no seasons`);
            return;
        }

        const teamSeasons = Object.fromEntries(teamData.seasons.map(season => [season.seasonId, season]));

        if (!teamSeasons[seasonId]) {
            setError(`${teamType} team has not registered for this season: ${seasonId}`);
            return;
        }

        const players = teamSeasons[seasonId].players;

        matches.forEach(match => {
           const matchPlayers = match[teamType + 'Players'];
           matchPlayers.forEach(matchPlayer => {
               const correspondingPlayer = players.filter(p => p.id === matchPlayer.id)[0];
               if (correspondingPlayer && correspondingPlayer.name !== matchPlayer.name && !correspondingPlayer.renamed) {
                   correspondingPlayer.name = `${correspondingPlayer.name} (nee ${matchPlayer.name})`;
                   correspondingPlayer.renamed = true;
               }
               if (correspondingPlayer && correspondingPlayer.captain) {
                   matchPlayer.captain = correspondingPlayer.captain;
               }
           });
        });

        players.sort(nameSort);
        players.push({
            id: NEW_PLAYER,
            name: 'Add a player...'
        });
        return players;
    }

    async function loadFixtureData() {
        const http = new Http(new Settings());
        const gameApi = new GameApi(http);
        const seasonApi = new SeasonApi(http);
        const gameData = await gameApi.get(fixtureId);

        try {
            if (!gameData) {
                setError('Game could not be found');
                return;
            }

            if (!gameData.home || !gameData.away) {
                setError('Either home or away team are undefined for this game');
                return;
            }

            const homeTeamPlayers = await loadTeamPlayers(gameData.home.id, gameData.seasonId, 'home', gameData.matches);

            if (error || !homeTeamPlayers) {
                return;
            }

            const awayTeamPlayers = await loadTeamPlayers(gameData.away.id, gameData.seasonId, 'away', gameData.matches);

            if (error || !awayTeamPlayers) {
                return;
            }

            setHomeTeam(homeTeamPlayers);
            setAwayTeam(awayTeamPlayers);

            const allPlayers = homeTeamPlayers.concat(awayTeamPlayers).filter(p => p.id !== NEW_PLAYER);
            allPlayers.sort(nameSort);

            if (!gameData.matches || !gameData.matches.length) {
                gameData.matches = [{}, {}, {}, {}, {}, {}, {}, {}];
            }

            setAllPlayers(allPlayers);
            setFixtureData(gameData);
            setData(gameData);

            const seasonsResponse = await seasonApi.getAll();
            const season = seasonsResponse.filter(s => s.id === gameData.seasonId)[0];

            setSeason(season);
            setSeasons(seasonsResponse);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading('ready');
        }
    }

    useEffect(() => {
        if (!fixtureData || !divisions) {
            return;
        }

        const division = divisions[fixtureData.divisionId];
        if (division) {
            setDivision(division);
        }
    }, [ divisions, fixtureData, data ]);

    function onMatchChanged(newMatch, index) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData.matches[index] = newMatch;

        setFixtureData(newFixtureData);
    }

    function manOfTheMatchChanged(player, team) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData[team].manOfTheMatch = player ? player.id : undefined;

        setFixtureData(newFixtureData);
    }

    function add180(player) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, fixtureData.matches[0]);
        newFixtureData.matches[0] = firstMatch;

        if (!firstMatch.oneEighties) {
            firstMatch.oneEighties = [];
        }

        firstMatch.oneEighties.push({
            id: player.id,
            name: player.name
        });

        setFixtureData(newFixtureData);

    }

    function addHiCheck(player, notes) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, fixtureData.matches[0]);
        newFixtureData.matches[0] = firstMatch;

        if (!firstMatch.over100Checkouts) {
            firstMatch.over100Checkouts = [];
        }

        firstMatch.over100Checkouts.push({
            id: player.id,
            name: player.name,
            notes: notes
        });

        setFixtureData(newFixtureData);
    }

    function removeOneEightyScore(playerId, index) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, fixtureData.matches[0]);
        newFixtureData.matches[0] = firstMatch;

        firstMatch.oneEighties.splice(index, 1);

        setFixtureData(newFixtureData);
    }

    function removeHiCheck(playerId, index) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, fixtureData.matches[0]);
        newFixtureData.matches[0] = firstMatch;

        firstMatch.over100Checkouts.splice(index, 1);

        setFixtureData(newFixtureData);
    }

    async function saveScores() {
        if (access === 'readonly') {
            return;
        }

        try {
            const http = new Http(new Settings());
            const gameApi = new GameApi(http);

            setSaving(true);
            const result = await gameApi.updateScores(fixtureId, fixtureData);

            if (!result.success) {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    function changeFixtureProperty(event) {
        if (access !== 'admin') {
            return;
        }

        const newData = Object.assign({}, data);
        if (event.target.type === 'checkbox') {
            newData[event.target.name] = event.target.checked;
        } else {
            newData[event.target.name] = event.target.value;
        }
        setData(newData);
    }

    function toggleSubmission(submissionToShow) {
        if (submissionToShow === submission) {
            setSubmission(null);
            setFixtureData(data);
            return;
        }

        setSubmission(submissionToShow);
        setFixtureData(data[submissionToShow + 'Submission']);
    }

    function setMatch(index, match) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData.matches[index] = match;

        setFixtureData(newFixtureData);
    }

    function setManOfMatch(team, id) {
        const newData = Object.assign({}, data);
        newData[team].manOfTheMatch = id;

        setData(newData);
    }

    if (loading !== 'ready') {
        return (<Loading />);
    }

    if (error) {
        return (<div className="light-background p-3">Error: {error}</div>);
    }

    if (!allPlayers) {
        return (<div className="light-background p-3">There are no players for the home and/or away teams</div>);
    }

    const finalScore = fixtureData.matches.map(match => {
        return { awayScore: match.awayScore, homeScore: match.homeScore };
    }).reduce((prev, current) => {
        return {
            awayScore: prev.awayScore + current.awayScore,
            homeScore: prev.homeScore + current.homeScore
        };
    }, { awayScore: 0, homeScore: 0 });
    const winner = finalScore.homeScore > finalScore.awayScore
        ? 'home'
        : (finalScore.awayScore > finalScore.homeScore ? 'away' : null);

    return (<div>
        <DivisionControls
            reloadAll={apis.reloadAll}
            seasons={seasons}
            account={account}
            originalSeasonData={{
                id: season.id,
                name: season.name,
                startDate: season.startDate.substring(0, 10),
                endDate: season.endDate.substring(0, 10),
            }}
            originalDivisionData={division}
            divisions={divisions}
            onReloadDivisionData={apis.reloadAll}
            overrideMode="fixtures" />
        {fixtureData ? (<ul className="nav nav-tabs">
            <NavItem>
                <NavLink tag={Link} className="text-light"
                         to={`/division/${data.divisionId}/teams`}>Teams</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-light"
                         to={`/division/${data.divisionId}/fixtures`}>Fixtures</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-dark active"
                         to={`/score/${fixtureId}`}>Fixture</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-light"
                         to={`/division/${data.divisionId}/players`}>Players</NavLink>
            </NavItem>
        </ul>) : null}
        <div className="light-background p-3 overflow-auto">
            <table className="table">
                <tbody>
                <tr>
                    <td colSpan="2" className={`text-end fw-bold ${winner === 'home' ? 'bg-winner' : null}`}>
                        <Link to={`/division/${data.divisionId}/team:${data.home.id}/${data.seasonId}`} className="margin-right">{data.home.name}</Link>
                        {data.homeSubmission && (access === 'admin' || (account && data.home && account.teamId === data.home.id && access === 'clerk')) ? (<span onClick={() => toggleSubmission('home')} className={`btn btn-sm ${submission === 'home' ? 'btn-primary' : 'btn-outline-secondary'}`} title="See home submission">📬</span>) : null}
                    </td>
                    <td className="text-center">vs</td>
                    <td colSpan="2" className={`text-start fw-bold ${winner === 'away' ? 'bg-winner' : null}`}>
                        <Link to={`/division/${data.divisionId}/team:${data.away.id}/${data.seasonId}`} className="margin-right">{data.away.name}</Link>
                        {data.awaySubmission && (access === 'admin' || (account && data.away && account.teamId === data.away.id && access === 'clerk')) ? (<span onClick={() => toggleSubmission('away')} className={`btn btn-sm ${submission === 'away' ? 'btn-primary' : 'btn-outline-secondary'}`} title="See home submission">📬</span>) : null}
                    </td>
                </tr>
                {fixtureData.address || access === 'admin' ? (<tr>
                    {access === 'admin'
                        ? (<td colSpan="5">
                            <div className="input-group mb-3">
                                    <input disabled={saving} type="date" name="date" className="form-control margin-right date-selection" value={data.date.substring(0, 10)} onChange={changeFixtureProperty} />
                                    <input disabled={saving} type="text" name="address" className="form-control margin-right" value={data.address} onChange={changeFixtureProperty} />
                                    <div className="form-check form-switch margin-right">
                                       <input disabled={saving} type="checkbox" className="form-check-input" name="postponed" id="postponed" checked={data.postponed} onChange={changeFixtureProperty} />
                                       <label className="form-check-label" htmlFor="postponed">Postponed</label>
                                    </div>
                                    <div className="form-check form-switch">
                                       <input disabled={saving} type="checkbox" className="form-check-input" name="knockout" id="knockout" checked={data.isKnockout} onChange={changeFixtureProperty} />
                                       <label className="form-check-label" htmlFor="knockout">Knockout</label>
                                    </div>
                               </div>
                           </td>)
                        : (<td colSpan="5">
                            {data.isKnockout ? (<span className="fw-bold text-primary">Knockout at</span>) : <span className="fw-bold text-secondary">Playing at</span>}: {fixtureData.address}
                            {data.postponed ? (<span className="margin-left fw-bold text-danger ml-3">Postponed</span>) : null}
                            </td>)}
                </tr>) : null}
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Singles</td>
                </tr>
                <MatchPlayerSelection
                    numberOfLegs={5} playerCount={1} homePlayers={homeTeam} awayPlayers={awayTeam}
                    match={fixtureData.matches[0]} account={account}
                    disabled={access === 'readonly'} readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 0)}
                    otherMatches={[fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]}
                    onPlayerChanged={loadFixtureData}
                    home={fixtureData.home} away={fixtureData.away}
                    seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId} />
                {!fixtureData.resultsPublished && access === 'admin' && submission === null ? (<MergeMatch
                    readOnly={saving} matchIndex={0}
                    matches={fixtureData.matches}
                    homeSubmission={fixtureData.homeSubmission}
                    awaySubmission={fixtureData.awaySubmission}
                    acceptSubmission={(match) => setMatch(0, match)} />) : null}
                <MatchPlayerSelection
                    numberOfLegs={5} playerCount={1} homePlayers={homeTeam} awayPlayers={awayTeam}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')} disabled={access === 'readonly'}
                    match={fixtureData.matches[1]} account={account}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 1)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]}
                    home={fixtureData.home} away={fixtureData.away}
                    seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId} />
                {!fixtureData.resultsPublished && access === 'admin' && submission === null ? (<MergeMatch
                    readOnly={saving} matchIndex={1}
                    matches={fixtureData.matches}
                    homeSubmission={fixtureData.homeSubmission}
                    awaySubmission={fixtureData.awaySubmission}
                    acceptSubmission={(match) => setMatch(1, match)} />) : null}
                <MatchPlayerSelection
                    numberOfLegs={5} playerCount={1} homePlayers={homeTeam} awayPlayers={awayTeam}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')} disabled={access === 'readonly'}
                    match={fixtureData.matches[2]} account={account}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 2)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[3], fixtureData.matches[4]]}
                    home={fixtureData.home} away={fixtureData.away}
                    seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId} />
                {!fixtureData.resultsPublished && access === 'admin' && submission === null ? (<MergeMatch
                    readOnly={saving} matchIndex={2}
                    matches={fixtureData.matches}
                    homeSubmission={fixtureData.homeSubmission}
                    awaySubmission={fixtureData.awaySubmission}
                    acceptSubmission={(match) => setMatch(2, match)} />) : null}
                <MatchPlayerSelection
                    numberOfLegs={5} playerCount={1} homePlayers={homeTeam} awayPlayers={awayTeam}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')} disabled={access === 'readonly'}
                    match={fixtureData.matches[3]} account={account}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 3)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[4]]}
                    home={fixtureData.home} away={fixtureData.away}
                    seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId} />
                {!fixtureData.resultsPublished && access === 'admin' && submission === null ? (<MergeMatch
                    readOnly={saving} matchIndex={3}
                    matches={fixtureData.matches}
                    homeSubmission={fixtureData.homeSubmission}
                    awaySubmission={fixtureData.awaySubmission}
                    acceptSubmission={(match) => setMatch(3, match)} />) : null}
                <MatchPlayerSelection
                    playerCount={1} numberOfLegs={5} homePlayers={homeTeam} awayPlayers={awayTeam}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')} disabled={access === 'readonly'}
                    match={fixtureData.matches[4]} account={account}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 4)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3]]}
                    seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId}
                    home={fixtureData.home} away={fixtureData.away} />
                {!fixtureData.resultsPublished && access === 'admin' && submission === null ? (<MergeMatch
                    readOnly={saving} matchIndex={4}
                    matches={fixtureData.matches}
                    homeSubmission={fixtureData.homeSubmission}
                    awaySubmission={fixtureData.awaySubmission}
                    acceptSubmission={(match) => setMatch(4, match)} />) : null}
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Doubles</td>
                </tr>
                <MatchPlayerSelection
                    playerCount={2} numberOfLegs={3} homePlayers={homeTeam} awayPlayers={awayTeam}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')} disabled={access === 'readonly'}
                    match={fixtureData.matches[5]} account={account}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 5)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[6]]}
                    home={fixtureData.home} away={fixtureData.away}
                    seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId} />
                {!fixtureData.resultsPublished && access === 'admin' && submission === null ? (<MergeMatch
                    readOnly={saving} matchIndex={5}
                    matches={fixtureData.matches}
                    homeSubmission={fixtureData.homeSubmission}
                    awaySubmission={fixtureData.awaySubmission}
                    acceptSubmission={(match) => setMatch(5, match)} />) : null}
                <MatchPlayerSelection
                    playerCount={2} numberOfLegs={3} homePlayers={homeTeam} awayPlayers={awayTeam}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')} disabled={access === 'readonly'}
                    match={fixtureData.matches[6]} account={account}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 6)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[5]]}
                    home={fixtureData.home} away={fixtureData.away}
                    seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId} />
                {!fixtureData.resultsPublished && access === 'admin' && submission === null ? (<MergeMatch
                    readOnly={saving} matchIndex={6}
                    matches={fixtureData.matches}
                    homeSubmission={fixtureData.homeSubmission}
                    awaySubmission={fixtureData.awaySubmission}
                    acceptSubmission={(match) => setMatch(6, match)} />) : null}
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Triples</td>
                </tr>
                <MatchPlayerSelection
                    playerCount={3} numberOfLegs={3} homePlayers={homeTeam} awayPlayers={awayTeam}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')} disabled={access === 'readonly'}
                    match={fixtureData.matches[7]} account={account}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 7)}
                    onPlayerChanged={loadFixtureData}
                    home={fixtureData.home} away={fixtureData.away}
                    seasonId={fixtureData.seasonId} gameId={fixtureData.id} divisionId={fixtureData.divisionId} />
                {!fixtureData.resultsPublished && access === 'admin' && submission === null ? (<MergeMatch
                    readOnly={saving} matchIndex={7}
                    matches={fixtureData.matches}
                    homeSubmission={fixtureData.homeSubmission}
                    awaySubmission={fixtureData.awaySubmission}
                    acceptSubmission={(match) => setMatch(7, match)} />) : null}
                {access !== 'readonly' && (!fixtureData.resultsPublished || access === 'admin') ? (<tr>
                    <td colSpan="2">
                        Man of the match<br/>
                        {account.teamId === fixtureData.home.id || access === 'admin' ? (<PlayerSelection
                            players={allPlayers}
                            disabled={access === 'readonly'}
                            readOnly={saving}
                            selected={{id: fixtureData.home.manOfTheMatch}}
                            onChange={(elem, player) => manOfTheMatchChanged(player, 'home')}/>) : (<span>n/a</span>)}
                    </td>
                    <td></td>
                    <td colSpan="2">
                        Man of the match<br/>
                        {account.teamId === fixtureData.away.id || access === 'admin' ? (<PlayerSelection
                            players={allPlayers}
                            disabled={access === 'readonly'}
                            readOnly={saving}
                            selected={{id: fixtureData.away.manOfTheMatch}}
                            onChange={(elem, player) => manOfTheMatchChanged(player, 'away')}/>) : (<span>n/a</span>)}
                    </td>
                </tr>) : null}
                {!fixtureData.resultsPublished && access === 'admin' && (data.homeSubmission || data.awaySubmission) && ((!data.home.manOfTheMatch && data.homeSubmission.home.manOfTheMatch) || (!data.away.manOfTheMatch && data.awaySubmission.away.manOfTheMatch))
                    ? (<tr>
                        {data.home.manOfTheMatch ? (<td colSpan="2">Merged</td>) : (<td colSpan="2">
                            {data.homeSubmission && data.homeSubmission.home.manOfTheMatch
                                ? (<button className="btn btn-success btn-sm" onClick={() => setManOfMatch('away', data.homeSubmission.home.manOfTheMatch)}>
                                    Use {allPlayers.filter(p => p.id === data.homeSubmission.home.manOfTheMatch)[0].name}
                                </button>)
                                : (<button className="btn btn-secondary btn-sm" disabled={true}>Nothing to merge</button>)}
                        </td>)}
                        <td></td>
                        {data.away.manOfTheMatch ? (<td colSpan="2">Merged</td>) : (<td colSpan="2">
                            {data.awaySubmission && data.awaySubmission.away.manOfTheMatch
                                ? (<button className="btn btn-success btn-sm" onClick={() => setManOfMatch('away', data.awaySubmission.away.manOfTheMatch)}>
                                    Use {allPlayers.filter(p => p.id === data.awaySubmission.away.manOfTheMatch)[0].name}
                                </button>)
                                : (<button className="btn btn-secondary btn-sm" disabled={true}>Nothing to merge</button>)}
                        </td>)}
                    </tr>) : null}
                <tr>
                    <td colSpan="2">
                        180s<br/>
                        <MultiPlayerSelection
                            disabled={access === 'readonly'}
                            readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                            allPlayers={allPlayers}
                            players={fixtureData.matches[0].oneEighties || []}
                            onRemovePlayer={removeOneEightyScore}
                            onAddPlayer={add180}
                            divisionId={fixtureData.divisionId}
                            seasonId={fixtureData.seasonId} />
                    </td>
                    <td></td>
                    <td colSpan="2">
                        100+ c/o<br/>
                        <MultiPlayerSelection
                            disabled={access === 'readonly'}
                            readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                            allPlayers={allPlayers}
                            players={fixtureData.matches[0].over100Checkouts || []}
                            onRemovePlayer={removeHiCheck}
                            onAddPlayer={addHiCheck}
                            showNotes={true}
                            divisionId={fixtureData.divisionId}
                            seasonId={fixtureData.seasonId} />
                    </td>
                </tr>
                {!fixtureData.resultsPublished && access === 'admin' ? (<tr><td>Merge 180s and hi-checks</td></tr>) : null}
                </tbody>
            </table>
            {access !== 'readonly' && (!fixtureData.resultsPublished || access === 'admin') ? (<button className="btn btn-primary" onClick={saveScores}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status"
                                 aria-hidden="true"></span>) : null}
                Save
            </button>) : null}
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save score" />) : null}
    </div>);
}
