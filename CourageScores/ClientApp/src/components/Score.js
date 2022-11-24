import React, {useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import {Settings} from "../api/settings";
import {GameApi} from "../api/game";
import {Http} from "../api/http";
import {TeamApi} from "../api/team";
import {MatchPlayerSelection, NEW_PLAYER} from "./MatchPlayerSelection";
import {PlayerSelection} from "./PlayerSelection";
import {MultiPlayerSelection} from "./MultiPlayerSelection";
import {Link} from 'react-router-dom';
import {NavItem, NavLink} from "reactstrap";
import {ErrorDisplay} from "./ErrorDisplay";

export function Score({account}) {
    const {fixtureId} = useParams();
    const [loading, setLoading] = useState('init');
    const [fixtureData, setFixtureData] = useState(null);
    const [homeTeam, setHomeTeam] = useState([]);
    const [awayTeam, setAwayTeam] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [error, setError] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [canSave, setCanSave] = useState(true);
    const [ saveError, setSaveError ] = useState(null);

    useEffect(() => {
        const isAdmin = (account && account.access && account.access.manageScores);
        setDisabled(!isAdmin || false);
        setCanSave(isAdmin || false);
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

    function sortPlayers(x, y) {
        if (x.name > y.name) {
            return 1;
        } else if (x.name < y.name) {
            return -1;
        } else {
            return 0;
        }
    }

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
           });
        });

        players.sort(sortPlayers);
        players.push({
            id: NEW_PLAYER,
            name: 'Add a player...'
        });
        return players;
    }

    async function loadFixtureData() {
        const http = new Http(new Settings());
        const gameApi = new GameApi(http);
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
            allPlayers.sort(sortPlayers);

            if (!gameData.matches || !gameData.matches.length) {
                gameData.matches = [{}, {}, {}, {}, {}, {}, {}, {}];
            }

            setAllPlayers(allPlayers);
            setFixtureData(gameData);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading('ready');
        }
    }

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
        if (disabled) {
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

    if (loading !== 'ready') {
        return (<div className="light-background p-3">
            <span className="h1">🎯</span> Loading...
        </div>);
    }

    if (error) {
        return (<div className="light-background p-3">Error: {error}</div>);
    }

    if (!allPlayers) {
        return (<div className="light-background p-3">There are no players for the home and/or away teams</div>);
    }

    return (<div>
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
                <NavLink tag={Link} className="text-light"
                         to={`/division/${fixtureData.divisionId}/players`}>Players</NavLink>
            </NavItem>
        </ul>) : null}
        <div className="light-background p-3 overflow-auto">
            <table className="table">
                <tbody>
                <tr>
                    <th colSpan="2">{fixtureData.home.name}</th>
                    <th>vs</th>
                    <th colSpan="2">{fixtureData.away.name}</th>
                </tr>
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Singles</td>
                </tr>
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    match={fixtureData.matches[0]}
                    disabled={disabled}
                    readOnly={saving}
                    numberOfLegs={5}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 0)}
                    otherMatches={[fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]}
                    onPlayerChanged={loadFixtureData}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id} />
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={disabled}
                    readOnly={saving}
                    numberOfLegs={5}
                    match={fixtureData.matches[1]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 1)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id} />
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={disabled}
                    readOnly={saving}
                    numberOfLegs={5}
                    match={fixtureData.matches[2]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 2)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[3], fixtureData.matches[4]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id} />
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={disabled}
                    readOnly={saving}
                    numberOfLegs={5}
                    match={fixtureData.matches[3]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 3)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[4]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id} />
                <MatchPlayerSelection
                    playerCount={1}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={disabled}
                    readOnly={saving}
                    numberOfLegs={5}
                    match={fixtureData.matches[4]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 4)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id} />
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Doubles</td>
                </tr>
                <MatchPlayerSelection
                    playerCount={2}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={disabled}
                    readOnly={saving}
                    numberOfLegs={3}
                    match={fixtureData.matches[5]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 5)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[6]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id} />
                <MatchPlayerSelection
                    playerCount={2}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={disabled}
                    readOnly={saving}
                    numberOfLegs={3}
                    match={fixtureData.matches[6]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 6)}
                    onPlayerChanged={loadFixtureData}
                    otherMatches={[fixtureData.matches[5]]}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id} />
                <tr>
                    <td colSpan="5" className="text-primary fw-bold text-center">Triples</td>
                </tr>
                <MatchPlayerSelection
                    playerCount={3}
                    homePlayers={homeTeam}
                    awayPlayers={awayTeam}
                    disabled={disabled}
                    readOnly={saving}
                    numberOfLegs={3}
                    match={fixtureData.matches[7]}
                    onMatchChanged={(newMatch) => onMatchChanged(newMatch, 7)}
                    onPlayerChanged={loadFixtureData}
                    seasonId={fixtureData.seasonId}
                    home={fixtureData.home}
                    away={fixtureData.away}
                    gameId={fixtureData.id} />
                {canSave ? (<tr>
                    <td colSpan="2">
                        Man of the match<br/>
                        <PlayerSelection
                            players={allPlayers}
                            disabled={disabled}
                            readOnly={saving}
                            selected={{id: fixtureData.home.manOfTheMatch}}
                            onChange={(elem, player) => manOfTheMatchChanged(player, 'home')}/>
                    </td>
                    <td></td>
                    <td colSpan="2">
                        Man of the match<br/>
                        <PlayerSelection
                            players={allPlayers}
                            disabled={disabled}
                            readOnly={saving}
                            selected={{id: fixtureData.away.manOfTheMatch}}
                            onChange={(elem, player) => manOfTheMatchChanged(player, 'away')}/>
                    </td>
                </tr>) : null}
                <tr>
                    <td colSpan="2">
                        180s<br/>
                        <MultiPlayerSelection
                            disabled={disabled}
                            readOnly={saving}
                            allPlayers={allPlayers}
                            players={fixtureData.matches[0].oneEighties || []}
                            onRemovePlayer={removeOneEightyScore}
                            onAddPlayer={add180}/>
                    </td>
                    <td></td>
                    <td colSpan="2">
                        100+ c/o<br/>
                        <MultiPlayerSelection
                            disabled={disabled}
                            readOnly={saving}
                            allPlayers={allPlayers}
                            players={fixtureData.matches[0].over100Checkouts || []}
                            onRemovePlayer={removeHiCheck}
                            onAddPlayer={addHiCheck}
                            showNotes={true} />
                    </td>
                </tr>
                </tbody>
            </table>
            {canSave ? (<button className="btn btn-primary" onClick={saveScores}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status"
                                 aria-hidden="true"></span>) : null}
                Save
            </button>) : null}
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save score" />) : null}
    </div>);
}
