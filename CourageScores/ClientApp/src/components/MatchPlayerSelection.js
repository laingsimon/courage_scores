import React from 'react';
import {PlayerSelection} from "./PlayerSelection";

export function MatchPlayerSelection(props) {
    function homePlayer(index) {
        if (!props.match.homePlayers || props.match.homePlayers.length <= index) {
            return {};
        }

        return props.match.homePlayers[index];
    }

    function awayPlayer(index) {
        if (!props.match.awayPlayers || props.match.awayPlayers.length <= index) {
            return {};
        }

        return props.match.awayPlayers[index];
    }

    function homePlayerChanged(index, player) {
        const newMatch = Object.assign({ homePlayers: [] }, props.match);
        const existingPlayer = newMatch.homePlayers[index];
        if (player) {
            newMatch.homePlayers[index] = Object.assign({}, existingPlayer, {
                id: player.id,
                name: player.name
            });
        } else {
            newMatch.homePlayers[index] = {};
        }

        if (props.onMatchChanged) {
            props.onMatchChanged(newMatch);
        }
    }

    function awayPlayerChanged(index, player) {
        const newMatch = Object.assign({ awayPlayers: [] }, props.match);
        const existingPlayer = newMatch.awayPlayers[index];
        newMatch.awayPlayers[index] = Object.assign({}, existingPlayer, {
            id: player.id,
            name: player.name
        });

        if (props.onMatchChanged) {
            props.onMatchChanged(newMatch);
        }
    }

    function homeScoreChanged(newScore) {
        const newMatch = Object.assign({ }, props.match);
        newMatch.homeScore = newScore;
        newMatch.numberOfLegs = props.numberOfLegs;

        if (newMatch.homeScore > props.numberOfLegs) {
            newMatch.homeScore = props.numberOfLegs;
        }
        if (newMatch.awayScore + newMatch.homeScore > props.numberOfLegs) {
            newMatch.awayScore = props.numberOfLegs - newMatch.homeScore;
        }

        if (props.onMatchChanged) {
            props.onMatchChanged(newMatch);
        }
    }

    function awayScoreChanged(newScore) {
        const newMatch = Object.assign({ }, props.match);
        newMatch.awayScore = newScore;
        newMatch.numberOfLegs = props.numberOfLegs;

        if (newMatch.awayScore > props.numberOfLegs) {
            newMatch.awayScore = props.numberOfLegs;
        }
        if (newMatch.awayScore + newMatch.homeScore > props.numberOfLegs) {
            newMatch.homeScore = props.numberOfLegs - newMatch.awayScore;
        }

        if (props.onMatchChanged) {
            props.onMatchChanged(newMatch);
        }
    }

    function exceptPlayers(playerIndex, propertyName) {
        const exceptPlayerIds = [];

        if (props.otherMatches) {
            for (let matchIndex = 0; matchIndex < props.otherMatches.length; matchIndex++) {
                const otherMatch = props.otherMatches[matchIndex];
                const otherMatchPlayers = otherMatch[propertyName];

                if (otherMatchPlayers) {
                    for (let otherMatchPlayerIndex = 0; otherMatchPlayerIndex < otherMatchPlayers.length; otherMatchPlayerIndex++) {
                        const otherMatchPlayer = otherMatchPlayers[otherMatchPlayerIndex];
                        exceptPlayerIds.push(otherMatchPlayer.id);
                    }
                }
            }
        }

        const playerList = props.match[propertyName];
        if (!playerList) {
            return exceptPlayerIds;
        }

        for (let index = 0; index < props.playerCount; index++) {
            if (playerIndex !== index && playerList.length > index) {
                exceptPlayerIds.push(playerList[index].id);
            }
        }

        return exceptPlayerIds;
    }

    function playerIndexes() {
        const indexes = [];

        for (let index = 0; index < props.playerCount; index++) {
            indexes.push(index);
        }

        return indexes;
    }

    return (<tr>
        <td>
            {playerIndexes().map(index => (<PlayerSelection
                disabled={props.disabled}
                key={index}
                players={props.homePlayers}
                selected={homePlayer(index)}
                except={exceptPlayers(index, 'homePlayers')}
                onChange={(elem, player) => homePlayerChanged(index, player)} />))}
        </td>
        <td>
            <input disabled={props.disabled} type="number" max="5" min="0" value={props.match.homeScore === null ? '' : props.match.homeScore} onChange={(event) => homeScoreChanged(event.target.value)} />
        </td>
        <td>vs</td>
        <td>
            <input disabled={props.disabled} type="number" max="5" min="0" value={props.match.awayScore === null ? '' : props.match.awayScore} onChange={(event) => awayScoreChanged(event.target.value)} />
        </td>
        <td>
            {playerIndexes().map(index => (<PlayerSelection
                disabled={props.disabled}
                key={index}
                players={props.awayPlayers}
                selected={awayPlayer(index)}
                except={exceptPlayers(index, 'awayPlayers')}
                onChange={(elem, player) => awayPlayerChanged(index, player)} />))}
        </td>
    </tr>);
}