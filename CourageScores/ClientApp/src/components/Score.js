import React, {useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import {Settings} from "../api/settings";
import {GameApi} from "../api/game";
import {Http} from "../api/http";
import {TeamApi} from "../api/team";

export function Score() {
    const {fixtureId} = useParams();
    const [scoreCard, setScoreCard] = useState({
        matches: []
    });
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
    }, [fixtureData, loading, error, allPlayers]);

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
            <tr>
                <td>
                    <select>
                        <option></option>
                        {homeTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                </td>
                <td>
                    <input type="number" max="5" min="0"/>
                </td>
                <td>vs</td>
                <td>
                    <input type="number" max="5" min="0"/>
                </td>
                <td>
                    <select>
                        <option></option>
                        {awayTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                </td>
            </tr>
            <tr>
                <td colSpan="5">Doubles</td>
            </tr>
            <tr>
                <td>
                    <select>
                        <option></option>
                        {homeTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    <select>
                        <option></option>
                        {homeTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                </td>
                <td>
                    <input type="number" max="5" min="0"/>
                </td>
                <td>vs</td>
                <td>
                    <input type="number" max="5" min="0"/>
                </td>
                <td>
                    <select>
                        <option></option>
                        {awayTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    <select>
                        <option></option>
                        {awayTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                </td>
            </tr>
            <tr>
                <td colSpan="5">Triples</td>
            </tr>
            <tr>
                <td>
                    <select>
                        <option></option>
                        {homeTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    <select>
                        <option></option>
                        {homeTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    <select>
                        <option></option>
                        {homeTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                </td>
                <td>
                    <input type="number" max="5" min="0"/>
                </td>
                <td>vs</td>
                <td>
                    <input type="number" max="5" min="0"/>
                </td>
                <td>
                    <select>
                        <option></option>
                        {awayTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    <select>
                        <option></option>
                        {awayTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    <select>
                        <option></option>
                        {awayTeam.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                </td>
            </tr>
            <tr>
                <td>Man of the match</td>
                <td>
                    <select>
                        <option></option>
                        {allPlayers.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                </td>
                <td></td>
                <td>
                    <select>
                        <option></option>
                        {allPlayers.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                </td>
                <td></td>
            </tr>
            <tr>
                <td>180s</td>
                <td>
                    <select>
                        <option></option>
                        {allPlayers.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select> +
                </td>
                <td></td>
                <td>100+ c/o</td>
                <td>
                    <select>
                        <option></option>
                        {allPlayers.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select> +
                </td>
            </tr>
            </tbody>
        </table>
    </div>);
}