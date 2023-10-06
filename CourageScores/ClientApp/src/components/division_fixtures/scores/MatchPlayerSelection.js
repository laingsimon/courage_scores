import React, {useState} from 'react';
import {PlayerSelection} from "../../division_players/PlayerSelection";
import {Dialog} from "../../common/Dialog";
import {any, distinct} from "../../../helpers/collections";
import {repeat} from "../../../helpers/projection";
import {propChanged, stateChanged} from "../../../helpers/events";
import {EditMatchOptions} from "../EditMatchOptions";
import {ScoreAsYouGo} from "../sayg/ScoreAsYouGo";
import {useApp} from "../../../AppContainer";
import {useLeagueFixture} from "./LeagueFixtureContainer";
import {useMatchType} from "./MatchTypeContainer";
import {EmbedAwareLink} from "../../common/EmbedAwareLink";

export const NEW_PLAYER = 'NEW_PLAYER';

export function MatchPlayerSelection({match, onMatchChanged, onMatchOptionsChanged, on180, onHiCheck}) {
    const {account, onError} = useApp();
    const {homePlayers, awayPlayers, readOnly, disabled, division, season, home, away} = useLeagueFixture();
    const {matchOptions, otherMatches, setCreatePlayerFor} = useMatchType();
    const [matchOptionsDialogOpen, setMatchOptionsDialogOpen] = useState(false);
    const [saygOpen, setSaygOpen] = useState(false);

    function player(index, side) {
        const matchPlayers = match[side + 'Players'];

        if (!matchPlayers || index >= matchPlayers.length) {
            return {};
        }

        return matchPlayers[index] || {};
    }

    function linkToPlayer(index, side, team) {
        const playerData = player(index, side);

        return (<EmbedAwareLink
            to={`/division/${division.name}/player:${playerData.name}@${team.name}/${season.name}`}>
            {playerData.name}
        </EmbedAwareLink>);
    }

    async function playerChanged(index, player, side) {
        try {
            if (readOnly || disabled) {
                return;
            }

            if (player && player.id === NEW_PLAYER) {
                setCreatePlayerFor({index, side});
                return;
            }

            const emptyMatch = {};
            emptyMatch[side + 'Players'] = [];
            const newMatch = Object.assign(emptyMatch, match);
            const players = newMatch[side + 'Players'];
            const existingPlayer = players[index];
            if (player) {
                players[index] = Object.assign({}, existingPlayer, player);
            } else {
                newMatch[side + 'Score'] = null;
                newMatch.sayg = null;
                players.splice(index, 1);
            }

            if (onMatchChanged) {
                await onMatchChanged(newMatch);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    async function scoreChanged(newScore, side) {
        try {
            if (readOnly || disabled) {
                return;
            }

            const oppositeSide = side === 'home' ? 'away' : 'home';
            const oppositeScore = match[oppositeSide + 'Score'];
            const newMatch = Object.assign({}, match);
            const numberOfLegs = matchOptions.numberOfLegs;
            const intScore = newScore ? Math.min(Number.parseInt(newScore), numberOfLegs) : null;

            newMatch[side + 'Score'] = intScore;

            if (intScore + oppositeScore > numberOfLegs) {
                newMatch[oppositeSide + 'Score'] = numberOfLegs - intScore;
            }

            if (onMatchChanged) {
                await onMatchChanged(newMatch);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function exceptPlayers(playerIndex, side) {
        const propertyName = side + 'Players';
        const selectedPlayer = player(playerIndex, side);
        const exceptPlayerIds = distinct((otherMatches || [])
            .flatMap(otherMatch => {
                return (otherMatch[propertyName] || []).filter(p => p || false).map(player => player ? player.id : null);
            }))
            .filter(id => id !== selectedPlayer.id); // dont exclude the currently selected player

        const playerList = match[propertyName];
        if (!playerList) {
            return exceptPlayerIds;
        }

        const additionalPlayers = playerList.filter((_, index) => index !== playerIndex).map(player => player.id);
        return exceptPlayerIds
            .concat(additionalPlayers)
            .filter(id => id !== selectedPlayer.id); // dont exclude the currently selected player;
    }

    function renderMatchSettingsDialog() {
        return (<Dialog title="Edit match options" slim={true} onClose={() => setMatchOptionsDialogOpen(false)}>
            <EditMatchOptions matchOptions={matchOptions} onMatchOptionsChanged={onMatchOptionsChanged}/>
        </Dialog>);
    }

    async function add180(sideName) {
        const players = match[sideName + 'Players'];
        await on180(players[0]);
    }

    async function addHiCheck(sideName, score) {
        const players = match[sideName + 'Players'];
        await onHiCheck(players[0], score.toString());
    }

    async function updateMatchScore(homeScore, awayScore) {
        const newMatch = Object.assign({}, match);
        newMatch.homeScore = homeScore;
        newMatch.awayScore = awayScore;

        if (onMatchChanged) {
            await onMatchChanged(newMatch);
        }
    }

    function renderSaygDialog() {
        const home = match.homePlayers.reduce((current, next) => current ? current + ' & ' + next.name : next.name, '');
        const away = match.awayPlayers.reduce((current, next) => current ? current + ' & ' + next.name : next.name, '');
        const singlePlayerMatch = match.homePlayers.length === 1 && match.awayPlayers.length === 1;

        return (<Dialog slim={true} title={`${home} vs ${away} - best of ${matchOptions.numberOfLegs}`}
                        onClose={() => setSaygOpen(false)} className="text-start">
            <ScoreAsYouGo
                data={match.sayg || {legs: {}}}
                home={home}
                away={away}
                onChange={propChanged(match, onMatchChanged, 'sayg')}
                onLegComplete={!readOnly ? updateMatchScore : null}
                startingScore={matchOptions.startingScore}
                numberOfLegs={matchOptions.numberOfLegs}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                on180={singlePlayerMatch && on180 && !readOnly ? add180 : null}
                onHiCheck={singlePlayerMatch && onHiCheck && !readOnly ? addHiCheck : null}/>
        </Dialog>)
    }

    function canOpenSayg() {
        return any(match.homePlayers || [])
            && any(match.awayPlayers || [])
            && (match.sayg || (account || {access: {}}).access.recordScoresAsYouGo);
    }

    try {
        return (<tr>
            <td className={`${match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore ? 'bg-winner ' : ''}text-end width-50-pc position-relative`}>
                {canOpenSayg() ? (<button className="btn btn-sm position-absolute left-0"
                                          onClick={() => setSaygOpen(!saygOpen)}>📊</button>) : null}
                {saygOpen ? renderSaygDialog() : null}
                {repeat(matchOptions.playerCount).map(index => disabled
                    ? (<div key={index}>{linkToPlayer(index, 'home', home)}</div>)
                    : (<div key={index}><PlayerSelection
                        disabled={disabled}
                        readOnly={readOnly}
                        players={homePlayers}
                        selected={player(index, 'home')}
                        except={exceptPlayers(index, 'home')}
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
                        onChange={stateChanged(async newScore => await scoreChanged(newScore, 'home'))}/>)}
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
                    <button tabIndex={-1} title={`${matchOptions.numberOfLegs} leg/s. Starting score: ${matchOptions.startingScore}`}
                            className="btn btn-sm right-0 position-absolute"
                            onClick={() => setMatchOptionsDialogOpen(true)}>🛠</button>)}
                {repeat(matchOptions.playerCount).map(index => disabled
                    ? (<div key={index}>{linkToPlayer(index, 'away', away)}</div>)
                    : (<div key={index}>
                        <PlayerSelection
                            disabled={disabled}
                            readOnly={readOnly}
                            players={awayPlayers}
                            selected={player(index, 'away')}
                            except={exceptPlayers(index, 'away')}
                            onChange={(elem, player) => playerChanged(index, player, 'away')}/>
                    </div>))}
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
