import React from 'react';
import {PlayerSelection} from "./PlayerSelection";

export function MatchPlayerSelection({ match, onMatchChanged, numberOfLegs, otherMatches, playerCount, disabled, homePlayers, awayPlayers, readOnly }) {
    function homePlayer(index) {
        if (!match.homePlayers || match.homePlayers.length <= index) {
            return {};
        }

        return match.homePlayers[index];
    }

    function awayPlayer(index) {
        if (!match.awayPlayers || match.awayPlayers.length <= index) {
            return {};
        }

        return match.awayPlayers[index];
    }

    function homePlayerChanged(index, player) {
        const newMatch = Object.assign({ homePlayers: [] }, match);
        const existingPlayer = newMatch.homePlayers[index];
        if (player) {
            newMatch.homePlayers[index] = Object.assign({}, existingPlayer, {
                id: player.id,
                name: player.name
            });
        } else {
            newMatch.homePlayers[index] = {};
        }

        if (onMatchChanged) {
            onMatchChanged(newMatch);
        }
    }

    function awayPlayerChanged(index, player) {
        const newMatch = Object.assign({ awayPlayers: [] }, match);
        const existingPlayer = newMatch.awayPlayers[index];
        if (player) {
            newMatch.awayPlayers[index] = Object.assign({}, existingPlayer, {
                id: player.id,
                name: player.name
            });
        } else {
            newMatch.awayPlayers[index] = {};
        }

        if (onMatchChanged) {
            onMatchChanged(newMatch);
        }
    }

    function homeScoreChanged(newScore) {
        const newMatch = Object.assign({ }, match);
        newMatch.homeScore = Number.parseInt(newScore);
        newMatch.numberOfLegs = numberOfLegs;

        if (newMatch.homeScore > numberOfLegs) {
            newMatch.homeScore = numberOfLegs;
        }
        if (newMatch.awayScore + newMatch.homeScore > numberOfLegs) {
            newMatch.awayScore = numberOfLegs - newMatch.homeScore;
        }

        if (onMatchChanged) {
            onMatchChanged(newMatch);
        }
    }

    function awayScoreChanged(newScore) {
        const newMatch = Object.assign({ }, match);
        newMatch.awayScore = Number.parseInt(newScore);
        newMatch.numberOfLegs = numberOfLegs;

        if (newMatch.awayScore > numberOfLegs) {
            newMatch.awayScore = numberOfLegs;
        }
        if (newMatch.awayScore + newMatch.homeScore > numberOfLegs) {
            newMatch.homeScore = numberOfLegs - newMatch.awayScore;
        }

        if (onMatchChanged) {
            onMatchChanged(newMatch);
        }
    }

    function exceptPlayers(playerIndex, propertyName) {
        const exceptPlayerIds = [];

        if (otherMatches) {
            for (let matchIndex = 0; matchIndex < otherMatches.length; matchIndex++) {
                const otherMatch = otherMatches[matchIndex];
                const otherMatchPlayers = otherMatch[propertyName];

                if (otherMatchPlayers) {
                    for (let otherMatchPlayerIndex = 0; otherMatchPlayerIndex < otherMatchPlayers.length; otherMatchPlayerIndex++) {
                        const otherMatchPlayer = otherMatchPlayers[otherMatchPlayerIndex];
                        exceptPlayerIds.push(otherMatchPlayer.id);
                    }
                }
            }
        }

        const playerList = match[propertyName];
        if (!playerList) {
            return exceptPlayerIds;
        }

        for (let index = 0; index < playerCount; index++) {
            if (playerIndex !== index && playerList.length > index) {
                exceptPlayerIds.push(playerList[index].id);
            }
        }

        return exceptPlayerIds;
    }

    function playerIndexes() {
        const indexes = [];

        for (let index = 0; index < playerCount; index++) {
            indexes.push(index);
        }

        return indexes;
    }

    return (<tr>
        <td>
            {playerIndexes().map(index => disabled ? (<div>{homePlayer(index).name}</div>) : (<PlayerSelection
                disabled={disabled}
                readOnly={readOnly}
                key={index}
                players={homePlayers}
                selected={homePlayer(index)}
                except={exceptPlayers(index, 'homePlayers')}
                onChange={(elem, player) => homePlayerChanged(index, player)} />))}
        </td>
        <td className="vertical-align-middle">
            {disabled
                ? (match.homeScore)
                : (<input
                    disabled={disabled}
                    readOnly={readOnly}
                    type="number" max="5" min="0"
                    value={match.homeScore || '0'}
                    onChange={(event) => homeScoreChanged(event.target.value)} />)}
        </td>
        <td className="vertical-align-middle">vs</td>
        <td className="vertical-align-middle">
            {disabled
                ? (match.awayScore)
                : (<input
                    disabled={disabled}
                    readOnly={readOnly}
                    type="number" max="5" min="0"
                    value={match.awayScore || '0'}
                    onChange={(event) => awayScoreChanged(event.target.value)} />) }
        </td>
        <td>
            {playerIndexes().map(index => disabled ? (<div>{awayPlayer(index).name}</div>) : (<PlayerSelection
                disabled={disabled}
                readOnly={readOnly}
                key={index}
                players={awayPlayers}
                selected={awayPlayer(index)}
                except={exceptPlayers(index, 'awayPlayers')}
                onChange={(elem, player) => awayPlayerChanged(index, player)} />))}
        </td>
    </tr>);
}
