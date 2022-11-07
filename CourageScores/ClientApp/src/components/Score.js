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

export function Score() {
    const {fixtureId} = useParams();
    const [loading, setLoading] = useState(true);
    const [fixtureData, setFixtureData] = useState(null);
    const [homeTeam, setHomeTeam] = useState([]);
    const [awayTeam, setAwayTeam] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (fixtureData) {
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
                const awayTeamPlayers = await loadTeamData(gameData.away.id, gameData.seasonId, 'away');

                if (error) {
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
    }, [ fixtureData, loading, error, allPlayers, fixtureId ]);

    function onMatchChanged(newMatch, index) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData.matches[index] = newMatch;

        setFixtureData(newFixtureData);
    }

    function manOfTheMatchChanged(player, team) {
        const newFixtureData = Object.assign({}, fixtureData);
        const newManOfTheMatch = Object.assign({}, newFixtureData[team].manOfTheMatch);
        newManOfTheMatch.id = player.id;
        newManOfTheMatch.name = player.name;
        newFixtureData[team].manOfTheMatch = newManOfTheMatch;

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

    function saveScores() {
        alert('Save scores');
    }

    if (loading) {
        return (<div className="light-background p-3">Loading fixture...</div>);
    }

    if (error) {
        return (<div className="light-background p-3">Error: {error}</div>);
    }

    return (<div className="light-background p-3">
        <h3>Record the scores of a game</h3>
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
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 0)}
                otherMatches={[fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]} />
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                match={fixtureData.matches[1]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 1)}
                otherMatches={[fixtureData.matches[0], fixtureData.matches[2], fixtureData.matches[3], fixtureData.matches[4]]} />
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                match={fixtureData.matches[2]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 2)}
                otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[3], fixtureData.matches[4]]} />
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
                match={fixtureData.matches[3]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 3)}
                otherMatches={[fixtureData.matches[0], fixtureData.matches[1], fixtureData.matches[2], fixtureData.matches[4]]} />
            <MatchPlayerSelection
                playerCount={1}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
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
                match={fixtureData.matches[5]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 5)}
                otherMatches={[fixtureData.matches[6]]} />
            <MatchPlayerSelection
                playerCount={2}
                homePlayers={homeTeam}
                awayPlayers={awayTeam}
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
                match={fixtureData.matches[7]}
                onMatchChanged={(newMatch) => onMatchChanged(newMatch, 7)} />
            <tr>
                <td>Man of the match</td>
                <td>
                    <PlayerSelection
                        players={allPlayers}
                        selected={fixtureData.home.manOfTheMatch}
                        onChange={(elem, player) => manOfTheMatchChanged(player, 'home')} />
                </td>
                <td></td>
                <td>
                    <PlayerSelection
                        players={allPlayers}
                        selected={fixtureData.away.manOfTheMatch}
                        onChange={(elem, player) => manOfTheMatchChanged(player, 'away')} />
                </td>
                <td></td>
            </tr>
            <tr>
                <td>180s</td>
                <td>
                    <MultiPlayerSelection
                        allPlayers={allPlayers}
                        players={fixtureData.matches[0].oneEighties || []}
                        onRemovePlayer={removeOneEightyScore}
                        onAddPlayer={add180} />
                </td>
                <td></td>
                <td>100+ c/o</td>
                <td>
                    <MultiPlayerSelectionWithNotes
                        allPlayers={allPlayers}
                        players={fixtureData.matches[0].over100Checkouts || []}
                        onRemovePlayer={removeHiCheck}
                        onAddPlayer={addHiCheck} />
                </td>
            </tr>
            </tbody>
        </table>
        <button className="btn btn-primary" onClick={() => saveScores()}>Save</button>
    </div>);
}