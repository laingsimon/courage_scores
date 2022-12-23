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

export function Score({account, apis, divisions}) {
    const {fixtureId} = useParams();
    const [loading, setLoading] = useState('init');
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
    }, [ divisions, fixtureData ]);

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

        const newFixtureData = Object.assign({}, fixtureData);
        if (event.target.type === 'checkbox') {
            newFixtureData[event.target.name] = event.target.checked;
        } else {
            newFixtureData[event.target.name] = event.target.value;
        }
        setFixtureData(newFixtureData);
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
                         to={`/division/${fixtureData.divisionId}/teams`}>Teams</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-light"
                         to={`/division/${fixtureData.divisionId}/fixtures`}>Fixtures</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-dark active"
                         to={`/score/${fixtureId}`}>Fixture</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-light"
                         to={`/division/${fixtureData.divisionId}/players`}>Players</NavLink>
            </NavItem>
        </ul>) : null}
        <div className="light-background p-3 overflow-auto">
            <table className="table">
                <tbody>
                <tr>
                    <td colSpan="2" className={`text-end fw-bold ${winner === 'home' ? 'bg-winner' : null}`}>
                        <Link to={`/division/${fixtureData.divisionId}/team:${fixtureData.home.id}/${fixtureData.seasonId}`} className="margin-right">{fixtureData.home.name}</Link>
                    </td>
                    <td className="text-center">vs</td>
                    <td colSpan="2" className={`text-start fw-bold ${winner === 'away' ? 'bg-winner' : null}`}>
                        <Link to={`/division/${fixtureData.divisionId}/team:${fixtureData.away.id}/${fixtureData.seasonId}`} className="margin-right">{fixtureData.away.name}</Link>
                    </td>
                </tr>
                {fixtureData.address || access === 'admin' ? (<tr>
                    {access === 'admin'
                        ? (<td colSpan="5">
                            <div className="input-group mb-3">
                                    <input disabled={saving} type="date" name="date" className="form-control margin-right date-selection" value={fixtureData.date.substring(0, 10)} onChange={changeFixtureProperty} />
                                    <input disabled={saving} type="text" name="address" className="form-control margin-right" value={fixtureData.address} onChange={changeFixtureProperty} />
                                    <div className="form-check form-switch margin-right">
                                       <input disabled={saving} type="checkbox" className="form-check-input" name="postponed" id="postponed" checked={fixtureData.postponed} onChange={changeFixtureProperty} />
                                       <label className="form-check-label" htmlFor="postponed">Postponed</label>
                                    </div>
                                    <div className="form-check form-switch">
                                       <input disabled={saving} type="checkbox" className="form-check-input" name="knockout" id="knockout" checked={fixtureData.isKnockout} onChange={changeFixtureProperty} />
                                       <label className="form-check-label" htmlFor="knockout">Knockout</label>
                                    </div>
                               </div>
                           </td>)
                        : (<td colSpan="5">
                            {fixtureData.isKnockout ? (<span className="fw-bold text-primary">Knockout at</span>) : <span className="fw-bold text-secondary">Playing at</span>}: {fixtureData.address}
                            {fixtureData.postponed ? (<span className="margin-left fw-bold text-danger ml-3">Postponed</span>) : null}
                            </td>)}
                </tr>) : null}
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Singles</td>
                </tr>
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    match={fixtureData.matches[0]}
                    disabled={access === 'readonly'}
                    readOnly={saving}
                    numberOfLegs={5}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 0)}
                    otherMatches={[fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]}
                    onPlayerChanged={loadFixtureData}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id}
                    divisionId={fixtureData.divisionId}
                    account={account}  />
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={access === 'readonly'}
                    readOnly={saving}
                    numberOfLegs={5}
                    match={fixtureData.matches[1]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 1)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id}
                    divisionId={fixtureData.divisionId}
                    account={account}  />
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={access === 'readonly'}
                    readOnly={saving}
                    numberOfLegs={5}
                    match={fixtureData.matches[2]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 2)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[3], fixtureData.matches[4]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id}
                    divisionId={fixtureData.divisionId}
                    account={account}  />
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={access === 'readonly'}
                    readOnly={saving}
                    numberOfLegs={5}
                    match={fixtureData.matches[3]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 3)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[4]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id}
                    divisionId={fixtureData.divisionId}
                    account={account} />
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={access === 'readonly'}
                    readOnly={saving}
                    numberOfLegs={5}
                    match={fixtureData.matches[4]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 4)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id}
                    divisionId={fixtureData.divisionId}
                    account={account}  />
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Doubles</td>
                </tr>
                <MatchPlayerSelection
                    playerCount={2}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={access === 'readonly'}
                    readOnly={saving}
                    numberOfLegs={3}
                    match={fixtureData.matches[5]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 5)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[6]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id}
                    divisionId={fixtureData.divisionId}
                    account={account}  />
                <MatchPlayerSelection
                    playerCount={2}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={access === 'readonly'}
                    readOnly={saving}
                    numberOfLegs={3}
                    match={fixtureData.matches[6]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 6)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[5]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id}
                    divisionId={fixtureData.divisionId}
                    account={account}  />
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Triples</td>
                </tr>
                <MatchPlayerSelection
                    playerCount={3}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={access === 'readonly'}
                    readOnly={saving}
                    numberOfLegs={3}
                    match={fixtureData.matches[7]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 7)}
                    onPlayerChanged={loadFixtureData}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id}
                    divisionId={fixtureData.divisionId}
                    account={account}  />
                {access !== 'readonly' ? (<tr>
                    <td colSpan="2">
                        Man of the match<br/>
                        <PlayerSelection
                            players={allPlayers}
                            disabled={access === 'readonly'}
                            readOnly={saving}
                            selected={{id: fixtureData.home.manOfTheMatch}}
                            onChange={(elem, player) => manOfTheMatchChanged(player, 'home')}/>
                    </td>
                    <td></td>
                    <td colSpan="2">
                        Man of the match<br/>
                        <PlayerSelection
                            players={allPlayers}
                            disabled={access === 'readonly'}
                            readOnly={saving}
                            selected={{id: fixtureData.away.manOfTheMatch}}
                            onChange={(elem, player) => manOfTheMatchChanged(player, 'away')}/>
                    </td>
                </tr>) : null}
                <tr>
                    <td colSpan="2">
                        180s<br/>
                        <MultiPlayerSelection
                            disabled={access === 'readonly'}
                            readOnly={saving}
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
                            readOnly={saving}
                            allPlayers={allPlayers}
                            players={fixtureData.matches[0].over100Checkouts || []}
                            onRemovePlayer={removeHiCheck}
                            onAddPlayer={addHiCheck}
                            showNotes={true}
                            divisionId={fixtureData.divisionId}
                            seasonId={fixtureData.seasonId} />
                    </td>
                </tr>
                </tbody>
            </table>
            {access !== 'readonly' ? (<button className="btn btn-primary" onClick={saveScores}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status"
                                 aria-hidden="true"></span>) : null}
                Save
            </button>) : null}
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save score" />) : null}
    </div>);
}
