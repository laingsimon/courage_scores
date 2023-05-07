import React, {useState} from 'react';
import {PlayerSelection} from "../../division_players/PlayerSelection";
import {Dialog} from "../../common/Dialog";
import {Link} from "react-router-dom";
import {any, propChanged, stateChanged} from "../../../Utilities";
import {EditMatchOptions} from "../EditMatchOptions";
import {ScoreAsYouGo} from "../sayg/ScoreAsYouGo";
import {useApp} from "../../../AppContainer";

export const NEW_PLAYER = 'NEW_PLAYER';

export function MatchPlayerSelection({ match, onMatchChanged, otherMatches, disabled, homePlayers, awayPlayers, readOnly,
                                         seasonId, divisionId, matchOptions, onMatchOptionsChanged, on180, onHiCheck,
                                         setCreatePlayerFor }) {
    const { account, onError } = useApp();
    const [ matchOptionsDialogOpen, setMatchOptionsDialogOpen ] = useState(false);
    const [ saygOpen, setSaygOpen ] = useState(false);

    function player(index, side) {
        const matchPlayers = match[side + 'Players'];

        if (!matchPlayers || matchPlayers.length <= index) {
            return {};
        }

        return matchPlayers[index] || {};
    }

    async function playerChanged(index, player, side) {
        try {
            if (player && player.id === NEW_PLAYER) {
                setCreatePlayerFor({index, side});
                return;
            }

            const emptyMatch = {};
            emptyMatch[side + 'Players'] = [];
            const newMatch = Object.assign(emptyMatch, match);
            const existingPlayer = newMatch[side + 'Players'][index];
            if (player) {
                newMatch[side + 'Players'][index] = Object.assign({}, existingPlayer, player);
            } else {
                newMatch[side + 'Score'] = null;
                newMatch.sayg = null;
                newMatch[side + 'Players'].splice(index, 1);
            }

            if (onMatchChanged) {
                await onMatchChanged(newMatch);
            }
        } catch (e) {
            onError(e);
        }
    }

    async function scoreChanged(newScore, side) {
        try {
            const oppositeSide = side = 'home' ? 'away' : 'home';
            const oppositeScore = match[oppositeSide + 'Score'];
            const newMatch = Object.assign({}, match);
            const intScore = newScore ? Number.parseInt(newScore) : null;
            newMatch[side + 'Score'] = intScore;
            const numberOfLegs = matchOptions.numberOfLegs;

            if (intScore && intScore > numberOfLegs) {
                newMatch[side + 'Score'] = numberOfLegs;
            }

            if (intScore + oppositeScore > numberOfLegs) {
                newMatch[oppositeSide + 'Score'] = numberOfLegs - intScore;
            }

            if (onMatchChanged) {
                await onMatchChanged(newMatch);
            }
        } catch (e) {
            onError(e);
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

    function renderMatchSettingsDialog() {
        return (<Dialog title="Edit match options" slim={true} onClose={() => setMatchOptionsDialogOpen(false)}>
            <EditMatchOptions matchOptions={matchOptions} onMatchOptionsChanged={onMatchOptionsChanged} />
        </Dialog>);
    }

    function renderSaygDialog() {
        const home = match.homePlayers.reduce((current, next) => current ? current + ' & ' + next.name : next.name, '');
        const away = match.awayPlayers.reduce((current, next) => current ? current + ' & ' + next.name : next.name, '');

        const updateMatchScore = async (homeScore, awayScore) => {
            try {
                const newMatch = Object.assign({}, match);
                newMatch.homeScore = homeScore;
                newMatch.awayScore = awayScore;

                if (onMatchChanged) {
                    await onMatchChanged(newMatch);
                }
            } catch (e) {
                onError(e);
            }
        }

        async function add180IfSingles(sideName) {
            if (readOnly) {
                return;
            }

            try {
                const players = sideName === 'home' ? match.homePlayers : match.awayPlayers;
                if (players.length === 1) {
                    if (on180) {
                        await on180(players[0]);
                    }
                }
            } catch (e) {
                onError(e);
            }
        }

        async function addHiCheckIfSingles(sideName, score) {
            if (readOnly) {
                return;
            }

            try {
                const players = sideName === 'home' ? match.homePlayers : match.awayPlayers;
                if (players.length === 1) {
                    if (onHiCheck) {
                        await onHiCheck(players[0], score.toString());
                    }
                }
            } catch (e) {
                onError(e);
            }
        }

        return (<Dialog slim={true} title={`${home} vs ${away} - best of ${matchOptions.numberOfLegs}`} onClose={() => setSaygOpen(false)} className="text-start">
            <ScoreAsYouGo
                data={match.sayg || { legs: {} }}
                home={home}
                away={away}
                onChange={propChanged(match, onMatchChanged, 'sayg')}
                onLegComplete={updateMatchScore}
                startingScore={matchOptions.startingScore}
                numberOfLegs={matchOptions.numberOfLegs}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                on180={add180IfSingles}
                onHiCheck={addHiCheckIfSingles} />
        </Dialog>)
    }

    function canOpenSayg() {
        return any(match.homePlayers)
            && any(match.awayPlayers)
            && (match.sayg || (account || { access: {} }).access.recordScoresAsYouGo);
    }

    try {
        return (<tr>
            <td className={`${match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore ? 'bg-winner ' : ''}text-end width-50-pc position-relative`}>
                {canOpenSayg() ? (<button className="btn btn-sm position-absolute left-0"
                                          onClick={() => setSaygOpen(!saygOpen)}>📊</button>) : null}
                {saygOpen ? renderSaygDialog() : null}
                {playerIndexes().map(index => disabled
                    ? (<div key={index}><Link
                        to={`/division/${divisionId}/player:${homePlayer(index).id}/${seasonId}`}>{homePlayer(index).name}</Link>
                    </div>)
                    : (<div key={index}><PlayerSelection
                        disabled={disabled}
                        readOnly={readOnly}
                        players={homePlayers}
                        selected={player(index, 'home')}
                        except={exceptPlayers(index, 'homePlayers')}
                        onChange={(elem, player) => playerChanged(index, player, 'home')}/></div>))}
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
                        onChange={stateChanged(async newScore => await acoreChanged(newScore, 'home'))}/>)}
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
                        onChange={stateChanged(async newScore => scoreChanged(newScore, 'away'))}/>)}
            </td>
            <td className={`${match.homeScore !== null && match.awayScore !== null && match.homeScore < match.awayScore ? 'bg-winner ' : ''}width-50-pc position-relative`}>
                {matchOptionsDialogOpen ? renderMatchSettingsDialog() : null}
                {readOnly ? null : (
                    <button title={`${matchOptions.numberOfLegs} leg/s. Starting score: ${matchOptions.startingScore}`}
                            className="btn btn-sm right-0 position-absolute"
                            onClick={() => setMatchOptionsDialogOpen(true)}>🛠</button>)}
                {playerIndexes().map(index => disabled
                    ? (<div key={index}><Link
                        to={`/division/${divisionId}/player:${awayPlayer(index).id}/${seasonId}`}>{awayPlayer(index).name}</Link>
                    </div>)
                    : (<div key={index}>
                        <PlayerSelection
                            disabled={disabled}
                            readOnly={readOnly}
                            players={awayPlayers}
                            selected={player(index, 'away')}
                            except={exceptPlayers(index, 'awayPlayers')}
                            onChange={(elem, player) => playerChanged(index, player, 'away')}/>
                    </div>))}
            </td>
        </tr>);
    } catch (e) {
        onError(e);
    }
}
