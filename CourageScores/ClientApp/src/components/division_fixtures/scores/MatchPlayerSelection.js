import React, {useState} from 'react';
import {PlayerSelection} from "../../division_players/PlayerSelection";
import {Dialog} from "../../common/Dialog";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";
import {Link} from "react-router-dom";
import {propChanged, stateChanged} from "../../../Utilities";
import {EditMatchOptions} from "../EditMatchOptions";

export const NEW_PLAYER = 'NEW_PLAYER';

export function MatchPlayerSelection({ match, onMatchChanged, otherMatches, disabled,
                                         homePlayers, awayPlayers, readOnly, seasonId, home, away, gameId,
                                         onPlayerChanged, divisionId, account, matchOptions, onMatchOptionsChanged }) {
    const SHOW_EDIT_PLAYER_CONTROLS = false;
    const [ createPlayerFor, setCreatePlayerFor ] = useState(null);
    const [ newPlayerDetails, setNewPlayerDetails ] = useState(null);
    const [ matchOptionsDialogOpen, setMatchOptionsDialogOpen ] = useState(false);

    function homePlayer(index) {
        if (!match.homePlayers || match.homePlayers.length <= index) {
            return {};
        }

        return match.homePlayers[index] || {};
    }

    function awayPlayer(index) {
        if (!match.awayPlayers || match.awayPlayers.length <= index) {
            return {};
        }

        return match.awayPlayers[index] || {};
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
            newMatch.homePlayers[index] = Object.assign({}, existingPlayer, player);
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
            newMatch.awayPlayers[index] = Object.assign({}, existingPlayer, player);
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
        newMatch.numberOfLegs = matchOptions.numberOfLegs;

        if (newScore && newMatch.homeScore > matchOptions.numberOfLegs) {
            newMatch.homeScore = matchOptions.numberOfLegs;
        }
        if (newScore && newMatch.awayScore + newMatch.homeScore > matchOptions.numberOfLegs) {
            newMatch.awayScore = matchOptions.numberOfLegs - newMatch.homeScore;
        }

        if (onMatchChanged) {
            await onMatchChanged(newMatch);
        }
    }

    async function awayScoreChanged(newScore) {
        const newMatch = Object.assign({ }, match);
        newMatch.awayScore = newScore ? Number.parseInt(newScore) : null;
        newMatch.numberOfLegs = matchOptions.numberOfLegs;

        if (newScore && newMatch.awayScore > matchOptions.numberOfLegs) {
            newMatch.awayScore = matchOptions.numberOfLegs;
        }
        if (newScore && newMatch.awayScore + newMatch.homeScore > matchOptions.numberOfLegs) {
            newMatch.homeScore = matchOptions.numberOfLegs - newMatch.awayScore;
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
                        if (otherMatchPlayer) {
                            exceptPlayerIds.push(otherMatchPlayer.id);
                        }
                    }
                }
            }
        }

        const playerList = match[propertyName];
        if (!playerList) {
            return exceptPlayerIds;
        }

        for (let index = 0; index < matchOptions.playerCount; index++) {
            if (playerIndex !== index && playerList.length > index) {
                if (playerList[index]) {
                    exceptPlayerIds.push(playerList[index].id);
                }
            }
        }

        return exceptPlayerIds;
    }

    function playerIndexes() {
        const indexes = [];

        for (let index = 0; index < matchOptions.playerCount; index++) {
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
                {...newPlayerDetails}
                teamId={team.id}
                seasonId={seasonId}
                gameId={gameId}
                teams={[ team ]}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
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

    function canEditOrDelete(teamId) {
        if (!account || !account.access || readOnly || !SHOW_EDIT_PLAYER_CONTROLS) {
            return false;
        }

        if (account.access.manageScores) {
            return true;
        }

        return account.access.inputResults && account.teamId === teamId;
    }

    function renderMatchSettingsDialog() {
        return (<Dialog title="Edit match options" slim={true} onClose={() => setMatchOptionsDialogOpen(false)}>
            <EditMatchOptions matchOptions={matchOptions} onMatchOptionsChanged={onMatchOptionsChanged} />
        </Dialog>)
    }

    return (<tr>
        <td className={match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore ? 'bg-winner text-end width-50-pc' : 'text-end width-50-pc'}>
            {createPlayerFor ? renderCreatePlayerDialog() : null}
            {playerIndexes().map(index => disabled
                ? (<div key={index}><Link to={`/division/${divisionId}/player:${homePlayer(index).id}/${seasonId}`}>{homePlayer(index).name}</Link></div>)
                : (<div key={index}><PlayerSelection
                disabled={disabled}
                readOnly={readOnly}
                players={homePlayers}
                selected={homePlayer(index)}
                except={exceptPlayers(index, 'homePlayers')}
                onChange={(elem, player) => homePlayerChanged(index, player)}
                allowEdit={canEditOrDelete(home.id)}
                allowDelete={canEditOrDelete(home.id)}
                onDelete={playerUpdated}
                onEdit={playerUpdated}
                teamId={home.id}
                seasonId={seasonId}
                gameId={gameId} /></div>))}
        </td>
        <td className={`narrow-column align-middle text-end ${match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore ? 'bg-winner' : ''}`}>
            {disabled
                ? (<strong>{match.homeScore}</strong>)
                : (<input
                    disabled={disabled}
                    readOnly={readOnly}
                    className={readOnly ? 'border-1 border-secondary single-character-input no-spinner' : 'single-character-input no-spinner'}
                    type="number" max="5" min="0"
                    value={match.homeScore === null || match.homeScore === undefined ? '' : match.homeScore}
                    onChange={stateChanged(homeScoreChanged)} />)}
        </td>
        <td className="align-middle text-center width-1 middle-vertical-line p-0"></td>
        <td className={`narrow-column align-middle text-start ${match.homeScore !== null && match.awayScore !== null && match.homeScore < match.awayScore ? 'bg-winner' : ''}`}>
            {disabled
                ? (<strong>{match.awayScore}</strong>)
                : (<input
                    disabled={disabled}
                    readOnly={readOnly}
                    className={readOnly ? 'border-1 border-secondary single-character-input no-spinner' : 'single-character-input no-spinner'}
                    type="number" max="5" min="0"
                    value={match.awayScore === null || match.homeScore === undefined ? '' : match.awayScore}
                    onChange={stateChanged(awayScoreChanged)} />) }
        </td>
        <td className={match.homeScore !== null && match.awayScore !== null && match.homeScore < match.awayScore ? 'bg-winner width-50-pc' : ' width-50-pc'}>
            {matchOptionsDialogOpen ? renderMatchSettingsDialog() : null}
            <button className="btn btn-sm float-end" onClick={() => setMatchOptionsDialogOpen(true)}>🛠</button>

            {playerIndexes().map(index => disabled
                ? (<div key={index}><Link to={`/division/${divisionId}/player:${awayPlayer(index).id}/${seasonId}`}>{awayPlayer(index).name}</Link></div>)
                : (<div key={index}>
                    <PlayerSelection
                        disabled={disabled}
                        readOnly={readOnly}
                        players={awayPlayers}
                        selected={awayPlayer(index)}
                        except={exceptPlayers(index, 'awayPlayers')}
                        onChange={(elem, player) => awayPlayerChanged(index, player)}
                        allowEdit={canEditOrDelete(away.id)}
                        onEdit={playerUpdated}
                        allowDelete={canEditOrDelete(away.id)}
                        onDelete={playerUpdated}
                        teamId={away.id}
                        seasonId={seasonId}
                        gameId={gameId} />
                </div>))}
        </td>
    </tr>);
}
