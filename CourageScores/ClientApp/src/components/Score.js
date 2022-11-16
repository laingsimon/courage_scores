import React, {useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import {Settings} from "../api/settings";
import {GameApi} from "../api/game";
import {Http} from "../api/http";
import {TeamApi} from "../api/team";
import {MatchPlayerSelection} from "./MatchPlayerSelection";
import {PlayerSelection} from "./PlayerSelection";
import {MultiPlayerSelection} from "./MultiPlayerSelection";
import {MultiPlayerSelectionWithNotes} from "./MultiPlayerSelectionWithNotes";
import {Link} from 'react-router-dom';

export function Score(props) {
    const {fixtureId} = useParams();
    const [loading, setLoading] = useState(true);
    const [fixtureData, setFixtureData] = useState(null);
    const [homeTeam, setHomeTeam] = useState([]);
    const [awayTeam, setAwayTeam] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [error, setError] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [canSave, setCanSave] = useState(true);

    useEffect(() => {
        const isAdmin = (props.account && props.account.access && props.account.access.manageScores);
        setDisabled(!isAdmin || false);
        setCanSave(isAdmin || false);
    }, [ props.account ]);

    useEffect(() => {
        if (fixtureData || error) {
            return;
        }

        function sortPlayers(x, y) {
            if (x.name > y.name) {
                return 1;
            } else if (x.name < y.name) {
                return -1;
            } else {
                return 0;
            }
        }

        async function loadTeamData(teamId, seasonId, teamType) {
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

            const teamSeasons = Object.fromEntries(teamData.seasons.map(season => [ season.seasonId, season ]));

            if (!teamSeasons[seasonId]) {
                setError(`${teamType} team has not registered for this season: ${seasonId}`);
                return;
            }

            const players = teamSeasons[seasonId].players;
            players.sort(sortPlayers);
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

                const homeTeamPlayers = await loadTeamData(gameData.home.id, gameData.seasonId, 'home');

                if (error || !homeTeamPlayers) {
                    return;
                }

                const awayTeamPlayers = await loadTeamData(gameData.away.id, gameData.seasonId, 'away');

                if (error || !awayTeamPlayers) {
                    return;
                }

                setHomeTeam(homeTeamPlayers);
                setAwayTeam(awayTeamPlayers);

                const allPlayers = homeTeamPlayers.concat(awayTeamPlayers);
                allPlayers.sort(sortPlayers);

                if (!gameData.matches || !gameData.matches.length) {
                    gameData.matches = [ {}, {}, {}, {}, {}, {}, {}, {} ];
                }

                setAllPlayers(allPlayers);
                setFixtureData(gameData);
            }
            catch (e) {
                setError(e.toString());
            }
            finally {
                setLoading(false);
            }
        }

        loadFixtureData();
    });

    function onMatchChanged(newMatch, index) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData.matches[index] = newMatch;

        setFixtureData(newFixtureData);
    }

    function manOfTheMatchChanged(player, team) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData[team].manOfTheMatch = player.id;

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

        const http = new Http(new Settings());
        const gameApi = new GameApi(http);

        setDisabled(true);
        setSaving(true);
        await gameApi.updateScores(fixtureId, fixtureData);
        setDisabled(false);
        setSaving(false);
    }

    if (loading) {
        return (<div className="light-background p-3">
            <span className="h1">🎯</span> Loading...
        </div>);
    }

    if (error) {
        return (<div className="light-background p-3">Error: {error}</div>);
    }

    return (<div>
        {fixtureData ? (<div className="py-2"><Link className={`btn btn-light text-nowrap`} to={`/division/${fixtureData.divisionId}/fixtures`}>
            &larr; Fixtures
        </Link></div>) : null}
        <div className="light-background p-3 overflow-auto">
        <table className="table">
            <tbody>
            <tr>
                <th colSpan="2">{fixtureData.home.name}</th>
                <th>vs</th>
                <th colSpan="2">{fixtureData.away.name}</th>
            </tr>
            <tr>
                <td colSpan="5">Singles</td>
            </tr>
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                match={fixtureData.matches[0]}
                disabled={disabled}
                numberOfLegs={5}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 0)}
                otherMatches={[fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]} />
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                disabled={disabled}
                numberOfLegs={5}
                match={fixtureData.matches[1]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 1)}
                otherMatches={[fixtureData.matches[0], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]} />
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                disabled={disabled}
                numberOfLegs={5}
                match={fixtureData.matches[2]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 2)}
                otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[3], fixtureData.matches[4]]} />
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                disabled={disabled}
                numberOfLegs={5}
                match={fixtureData.matches[3]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 3)}
                otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[4]]} />
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                disabled={disabled}
                numberOfLegs={5}
                match={fixtureData.matches[4]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 4)}
                otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3]]} />
            <tr>
                <td colSpan="5">Doubles</td>
            </tr>
            <MatchPlayerSelection
                playerCount={2}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                disabled={disabled}
                numberOfLegs={3}
                match={fixtureData.matches[5]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 5)}
                otherMatches={[fixtureData.matches[6]]} />
            <MatchPlayerSelection
                playerCount={2}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                disabled={disabled}
                numberOfLegs={3}
                match={fixtureData.matches[6]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 6)}
                otherMatches={[fixtureData.matches[5]]} />
            <tr>
                <td colSpan="5">Triples</td>
            </tr>
            <MatchPlayerSelection
                playerCount={3}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                disabled={disabled}
                numberOfLegs={3}
                match={fixtureData.matches[7]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 7)} />
            {canSave ? (<tr>
                <td>
                    Man of the match<br />
                    <PlayerSelection
                        players={allPlayers}
                        disabled={disabled}
                        selected={ { id: fixtureData.home.manOfTheMatch } }
                        onChange={(elem, player) => manOfTheMatchChanged(player, 'home')} />
                </td>
                <td colSpan="3"></td>
                <td>
                    Man of the match<br />
                    <PlayerSelection
                        players={allPlayers}
                        disabled={disabled}
                        selected={ { id: fixtureData.away.manOfTheMatch } }
                        onChange={(elem, player) => manOfTheMatchChanged(player, 'away')} />
                </td>
            </tr>) : null}
            <tr>
                <td>180s</td>
                <td>
                    <MultiPlayerSelection
                        disabled={disabled}
                        allPlayers={allPlayers}
                        players={fixtureData.matches[0].oneEighties || []}
                        onRemovePlayer={removeOneEightyScore}
                        onAddPlayer={add180} />
                </td>
                <td></td>
                <td>100+ c/o</td>
                <td>
                    <MultiPlayerSelectionWithNotes
                        disabled={disabled}
                        allPlayers={allPlayers}
                        players={fixtureData.matches[0].over100Checkouts || []}
                        onRemovePlayer={removeHiCheck}
                        onAddPlayer={addHiCheck} />
                </td>
            </tr>
            </tbody>
        </table>
        {canSave ? (<button className="btn btn-primary" onClick={saveScores}>
            {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            Save
        </button>) : null}
    </div>
</div>);
}
