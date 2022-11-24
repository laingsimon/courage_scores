import React, {useState} from 'react';
import {PlayerSelection} from "./PlayerSelection";
import {Dialog} from "./Dialog";
import {EditPlayerDetails} from "./EditPlayerDetails";

export const NEW_PLAYER = 'NEW_PLAYER';

export function MatchPlayerSelection({ match, onMatchChanged, numberOfLegs, otherMatches, playerCount, disabled, homePlayers, awayPlayers, readOnly, seasonId, home, away, gameId, onPlayerChanged }) {
    const [ createPlayerFor, setCreatePlayerFor ] = useState(null);
    const [ newPlayerDetails, setNewPlayerDetails ] = useState(null);

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

    async function homePlayerChanged(index, player) {
        if (player.id === NEW_PLAYER) {
            setNewPlayerDetails({ name: '', captain: false });
            setCreatePlayerFor({ index, side: 'home' });
            return;
        }

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
            await onMatchChanged(newMatch);
        }
    }

    async function awayPlayerChanged(index, player) {
        if (player.id === NEW_PLAYER) {
            setNewPlayerDetails({ name: '', captain: false });
            setCreatePlayerFor({ index, side: 'away' });
            return;
        }

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
            await onMatchChanged(newMatch);
        }
    }

    async function homeScoreChanged(newScore) {
        const newMatch = Object.assign({ }, match);
        newMatch.homeScore = newScore ? Number.parseInt(newScore) : null;
        newMatch.numberOfLegs = numberOfLegs;

        if (newScore && newMatch.homeScore > numberOfLegs) {
            newMatch.homeScore = numberOfLegs;
        }
        if (newScore && newMatch.awayScore + newMatch.homeScore > numberOfLegs) {
            newMatch.awayScore = numberOfLegs - newMatch.homeScore;
        }

        if (onMatchChanged) {
            await onMatchChanged(newMatch);
        }
    }

    async function awayScoreChanged(newScore) {
        const newMatch = Object.assign({ }, match);
        newMatch.awayScore = newScore ? Number.parseInt(newScore) : null;
        newMatch.numberOfLegs = numberOfLegs;

        if (newScore && newMatch.awayScore > numberOfLegs) {
            newMatch.awayScore = numberOfLegs;
        }
        if (newScore && newMatch.awayScore + newMatch.homeScore > numberOfLegs) {
            newMatch.homeScore = numberOfLegs - newMatch.awayScore;
        }

        if (onMatchChanged) {
            await onMatchChanged(newMatch);
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

    async function playerUpdated() {
        if (onPlayerChanged) {
            await onPlayerChanged();
        }
    }

    function renderCreatePlayerDialog() {
        const team = createPlayerFor.side === 'home' ? home : away;

        return (<Dialog title={`Create ${createPlayerFor.side} player...`}>
            <EditPlayerDetails
                id={null}
                name={newPlayerDetails.name}
                teamId={team.id}
                seasonId={seasonId}
                gameId={gameId}
                captain={newPlayerDetails.captain}
                teams={[ team ]}
                onChange={onNewPlayerChanged}
                onCancel={() => setCreatePlayerFor(null)}
                onSaved={onPlayerCreated}
            />
        </Dialog>);
    }

    async function onPlayerCreated() {
        if (onPlayerChanged) {
            await onPlayerChanged();
        }

        if (createPlayerFor.side === 'home') {
            const player = homePlayers.filter(p => p.name === newPlayerDetails.name)[0];
            await homePlayerChanged(createPlayerFor.index, player || { id: '' });
        } else {
            const player = awayPlayers.filter(p => p.name === newPlayerDetails.name)[0];
            await awayPlayerChanged(createPlayerFor.index, player || { id: '' });
        }

        setNewPlayerDetails(null);
        setCreatePlayerFor(null);
    }

    async function onNewPlayerChanged(prop, value) {
        const newDetails = Object.assign({}, newPlayerDetails);
        newDetails[prop] = value;
        setNewPlayerDetails(newDetails);
    }

    return (<tr>
        <td>
            {createPlayerFor ? renderCreatePlayerDialog() : null}
            {playerIndexes().map(index => disabled ? (<div key={index}>{homePlayer(index).name}</div>) : (<PlayerSelection
                disabled={disabled}
                readOnly={readOnly}
                key={index}
                players={homePlayers}
                selected={homePlayer(index)}
                except={exceptPlayers(index, 'homePlayers')}
                onChange={(elem, player) => homePlayerChanged(index, player)}
                allowEdit={true}
                onEdit={playerUpdated}
                teamId={home.id}
                seasonId={seasonId}
                gameId={gameId} />))}
        </td>
        <td className="vertical-align-middle">
            {disabled
                ? (match.homeScore)
                : (<input
                    disabled={disabled}
                    readOnly={readOnly}
                    type="number" max="5" min="0"
                    value={match.homeScore === null ? '' : match.homeScore}
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
                    value={match.awayScore === null ? '' : match.awayScore}
                    onChange={(event) => awayScoreChanged(event.target.value)} />) }
        </td>
        <td>
            {playerIndexes().map(index => disabled ? (<div key={index}>{awayPlayer(index).name}</div>) : (<PlayerSelection
                disabled={disabled}
                readOnly={readOnly}
                key={index}
                players={awayPlayers}
                selected={awayPlayer(index)}
                except={exceptPlayers(index, 'awayPlayers')}
                onChange={(elem, player) => awayPlayerChanged(index, player)}
                allowEdit={true}
                onEdit={playerUpdated}
                teamId={away.id}
                seasonId={seasonId}
                gameId={gameId} />))}
        </td>
    </tr>);
}
