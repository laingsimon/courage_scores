import React, {useState} from 'react';
import {PlayerSelection} from "../../division_players/PlayerSelection";
import {Dialog} from "../../common/Dialog";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";
import {Link} from "react-router-dom";
import {any, propChanged, stateChanged} from "../../../Utilities";
import {EditMatchOptions} from "../EditMatchOptions";
import {ScoreAsYouGo} from "../sayg/ScoreAsYouGo";
import {useApp} from "../../../AppContainer";

export const NEW_PLAYER = 'NEW_PLAYER';

export function MatchPlayerSelection({ match, onMatchChanged, otherMatches, disabled,
                                         homePlayers, awayPlayers, readOnly, seasonId, home, away, gameId,
                                         onPlayerChanged, divisionId, matchOptions, onMatchOptionsChanged,
                                         on180, onHiCheck }) {
    const { account, onError } = useApp();
    const [ createPlayerFor, setCreatePlayerFor ] = useState(null);
    const [ newPlayerDetails, setNewPlayerDetails ] = useState(null);
    const [ matchOptionsDialogOpen, setMatchOptionsDialogOpen ] = useState(false);
    const [ saygOpen, setSaygOpen ] = useState(false);

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
        try {
            if (player.id === NEW_PLAYER) {
                setNewPlayerDetails({name: '', captain: false});
                setCreatePlayerFor({index, side: 'home'});
                return;
            }

            const newMatch = Object.assign({homePlayers: []}, match);
            const existingPlayer = newMatch.homePlayers[index];
            if (player) {
                newMatch.homePlayers[index] = Object.assign({}, existingPlayer, player);
            } else {
                newMatch.homePlayers[index] = {};
            }

            if (onMatchChanged) {
                await onMatchChanged(newMatch);
            }
        } catch (e) {
            onError(e);
        }
    }

    async function awayPlayerChanged(index, player) {
        try {
            if (player.id === NEW_PLAYER) {
                setNewPlayerDetails({name: '', captain: false});
                setCreatePlayerFor({index, side: 'away'});
                return;
            }

            const newMatch = Object.assign({awayPlayers: []}, match);
            const existingPlayer = newMatch.awayPlayers[index];
            if (player) {
                newMatch.awayPlayers[index] = Object.assign({}, existingPlayer, player);
            } else {
                newMatch.awayPlayers[index] = {};
            }

            if (onMatchChanged) {
                await onMatchChanged(newMatch);
            }
        } catch (e) {
            onError(e);
        }
    }

    async function homeScoreChanged(newScore) {
        try {
            const newMatch = Object.assign({}, match);
            newMatch.homeScore = newScore ? Number.parseInt(newScore) : null;

            if (newScore && newMatch.homeScore > matchOptions.numberOfLegs) {
                newMatch.homeScore = matchOptions.numberOfLegs;
            }
            if (newScore && newMatch.awayScore + newMatch.homeScore > matchOptions.numberOfLegs) {
                newMatch.awayScore = matchOptions.numberOfLegs - newMatch.homeScore;
            }

            if (onMatchChanged) {
                await onMatchChanged(newMatch);
            }
        } catch (e) {
            onError(e);
        }
    }

    async function awayScoreChanged(newScore) {
        try {
            const newMatch = Object.assign({}, match);
            newMatch.awayScore = newScore ? Number.parseInt(newScore) : null;

            if (newScore && newMatch.awayScore > matchOptions.numberOfLegs) {
                newMatch.awayScore = matchOptions.numberOfLegs;
            }
            if (newScore && newMatch.awayScore + newMatch.homeScore > matchOptions.numberOfLegs) {
                newMatch.homeScore = matchOptions.numberOfLegs - newMatch.awayScore;
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

    function renderCreatePlayerDialog() {
        const team = createPlayerFor.side === 'home' ? home : away;

        return (<Dialog title={`Create ${createPlayerFor.side} player...`}>
            <EditPlayerDetails
                id={null}
                {...newPlayerDetails}
                seasonId={seasonId}
                gameId={gameId}
                team={team}
                divisionId={divisionId}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
                onCancel={() => setCreatePlayerFor(null)}
                onSaved={onPlayerCreated}
            />
        </Dialog>);
    }

    async function onPlayerCreated() {
        try {
            if (onPlayerChanged) {
                await onPlayerChanged();
            }

            if (createPlayerFor.side === 'home') {
                const player = homePlayers.filter(p => p.name === newPlayerDetails.name)[0];
                await homePlayerChanged(createPlayerFor.index, player || {id: ''});
            } else {
                const player = awayPlayers.filter(p => p.name === newPlayerDetails.name)[0];
                await awayPlayerChanged(createPlayerFor.index, player || {id: ''});
            }

            setNewPlayerDetails(null);
            setCreatePlayerFor(null);
        } catch (e) {
            onError(e);
        }
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
                        await onHiCheck(players[0], score);
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
            <td className={match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore ? 'bg-winner text-end width-50-pc' : 'text-end width-50-pc'}>
                {canOpenSayg() ? (<button className="btn btn-sm float-start p-0"
                                          onClick={() => setSaygOpen(!saygOpen)}>📊</button>) : null}
                {saygOpen ? renderSaygDialog() : null}
                {createPlayerFor ? renderCreatePlayerDialog() : null}
                {playerIndexes().map(index => disabled
                    ? (<div key={index}><Link
                        to={`/division/${divisionId}/player:${homePlayer(index).id}/${seasonId}`}>{homePlayer(index).name}</Link>
                    </div>)
                    : (<div key={index}><PlayerSelection
                        disabled={disabled}
                        readOnly={readOnly}
                        players={homePlayers}
                        selected={homePlayer(index)}
                        except={exceptPlayers(index, 'homePlayers')}
                        onChange={(elem, player) => homePlayerChanged(index, player)}/></div>))}
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
                        onChange={stateChanged(homeScoreChanged)}/>)}
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
                        onChange={stateChanged(awayScoreChanged)}/>)}
            </td>
            <td className={match.homeScore !== null && match.awayScore !== null && match.homeScore < match.awayScore ? 'bg-winner width-50-pc' : ' width-50-pc'}>
                {matchOptionsDialogOpen ? renderMatchSettingsDialog() : null}
                {readOnly ? null : (
                    <button title={`${matchOptions.numberOfLegs} leg/s. Starting score: ${matchOptions.startingScore}`}
                            className="btn btn-sm float-end"
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
                            selected={awayPlayer(index)}
                            except={exceptPlayers(index, 'awayPlayers')}
                            onChange={(elem, player) => awayPlayerChanged(index, player)}/>
                    </div>))}
            </td>
        </tr>);
    } catch (e) {
        onError(e);
    }
}
