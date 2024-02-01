import React, {useState} from 'react';
import {ISelectablePlayer, PlayerSelection} from "../../division_players/PlayerSelection";
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
import {GamePlayerDto} from "../../../interfaces/models/dtos/Game/GamePlayerDto";
import {GameMatchDto} from "../../../interfaces/models/dtos/Game/GameMatchDto";
import {GameTeamDto} from "../../../interfaces/models/dtos/Game/GameTeamDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {UpdateRecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";

export const NEW_PLAYER: string = 'NEW_PLAYER';

export interface IMatchPlayerSelectionProps {
    match: GameMatchDto;
    onMatchChanged?: (newMatch: GameMatchDto) => Promise<any>;
    onMatchOptionsChanged: (newOptions: GameMatchOptionDto) => Promise<any>;
    on180: (player: GamePlayerDto) => Promise<any>;
    onHiCheck: (player: GamePlayerDto, score: number) => Promise<any>;
}

export function MatchPlayerSelection({match, onMatchChanged, onMatchOptionsChanged, on180, onHiCheck}: IMatchPlayerSelectionProps) {
    const {account, onError} = useApp();
    const {homePlayers, awayPlayers, readOnly, disabled, division, season, home, away} = useLeagueFixture();
    const {matchOptions, otherMatches, setCreatePlayerFor} = useMatchType();
    const [matchOptionsDialogOpen, setMatchOptionsDialogOpen] = useState<boolean>(false);
    const [saygOpen, setSaygOpen] = useState<boolean>(false);

    function player(index: number, side: 'home' | 'away'): GamePlayerDto {
        const matchPlayers: GamePlayerDto[] = match[side + 'Players'];

        if (!matchPlayers || index >= matchPlayers.length) {
            return {id: null, name: null};
        }

        return matchPlayers[index] || {id: null, name: null};
    }

    function linkToPlayer(index: number, side: 'home' | 'away', team: GameTeamDto) {
        const playerData: GamePlayerDto = player(index, side);

        return (<EmbedAwareLink
            to={`/division/${division.name}/player:${playerData.name}@${team.name}/${season.name}`}>
            {playerData.name}
        </EmbedAwareLink>);
    }

    async function playerChanged(index: number, player: ISelectablePlayer, side: 'home' | 'away') {
        try {
            if (readOnly || disabled) {
                return;
            }

            if (player && player.id === NEW_PLAYER) {
                await setCreatePlayerFor({index, side});
                return;
            }

            const emptyMatch: GameMatchDto = {};
            emptyMatch[side + 'Players'] = [];
            const newMatch: GameMatchDto = Object.assign(emptyMatch, match);
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

    async function scoreChanged(newScore: string, side: 'home' | 'away') {
        try {
            if (readOnly || disabled) {
                return;
            }

            const oppositeSide = side === 'home' ? 'away' : 'home';
            const oppositeScore = match[oppositeSide + 'Score'];
            const newMatch: GameMatchDto = Object.assign({}, match);
            const numberOfLegs: number = matchOptions.numberOfLegs;
            const intScore: number = newScore ? Math.min(Number.parseInt(newScore), numberOfLegs) : null;

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

    function exceptPlayers(playerIndex: number, side: 'home' | 'away'): string[] {
        const propertyName: string = side + 'Players';
        const selectedPlayer: GamePlayerDto = player(playerIndex, side);
        const exceptPlayerIds: string[] = distinct((otherMatches || [])
            .flatMap((otherMatch: GameMatchDto) => {
                return (otherMatch[propertyName] || [])
                    .filter((p?: GamePlayerDto) => p || false)
                    .map((player: GamePlayerDto) => player ? player.id : null);
            }))
            .filter(id => id !== selectedPlayer.id); // dont exclude the currently selected player

        const playerList: GamePlayerDto[] = match[propertyName];
        if (!playerList) {
            return exceptPlayerIds;
        }

        const additionalPlayers: string[] = playerList
            .filter((_: GamePlayerDto, index: number) => index !== playerIndex)
            .map((player: GamePlayerDto) => player.id);

        return exceptPlayerIds
            .concat(additionalPlayers)
            .filter((id: string) => id !== selectedPlayer.id); // dont exclude the currently selected player;
    }

    function renderMatchSettingsDialog() {
        return (<Dialog title="Edit match options" slim={true} onClose={async () => setMatchOptionsDialogOpen(false)}>
            <EditMatchOptions matchOptions={matchOptions} onMatchOptionsChanged={onMatchOptionsChanged}/>
        </Dialog>);
    }

    async function add180(sideName: 'home' | 'away') {
        const players: GamePlayerDto[] = match[sideName + 'Players'];
        await on180(players[0]);
    }

    async function addHiCheck(sideName: 'home' | 'away', score: number) {
        const players: GamePlayerDto[] = match[sideName + 'Players'];
        await onHiCheck(players[0], score);
    }

    async function updateMatchScore(homeScore: number, awayScore: number) {
        const newMatch: GameMatchDto = Object.assign({}, match);
        newMatch.homeScore = homeScore;
        newMatch.awayScore = awayScore;

        if (onMatchChanged) {
            await onMatchChanged(newMatch);
        }
    }

    function renderSaygDialog() {
        const home: string = match.homePlayers.reduce((current: string, next: GamePlayerDto) => current ? current + ' & ' + next.name : next.name, '');
        const away: string = match.awayPlayers.reduce((current: string, next: GamePlayerDto) => current ? current + ' & ' + next.name : next.name, '');
        const singlePlayerMatch: boolean = match.homePlayers.length === 1 && match.awayPlayers.length === 1;
        const defaultSaygData: UpdateRecordedScoreAsYouGoDto = {
            legs: {},
            yourName: ''
        };

        return (<Dialog slim={true} title={`${home} vs ${away} - best of ${matchOptions.numberOfLegs}`}
                        onClose={async () => setSaygOpen(false)} className="text-start">
            <ScoreAsYouGo
                data={(match.sayg as UpdateRecordedScoreAsYouGoDto) || defaultSaygData}
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

    function canOpenSayg(): boolean {
        return any(match.homePlayers || [])
            && any(match.awayPlayers || [])
            && (!!match.sayg || (account || {access: {}}).access.recordScoresAsYouGo);
    }

    try {
        return (<tr>
            <td className={`${match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore ? 'bg-winner ' : ''}text-end width-50-pc position-relative`}>
                {canOpenSayg() ? (<button tabIndex={-1} className="btn btn-sm position-absolute left-0"
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
                        onChange={(_, player: ISelectablePlayer) => playerChanged(index, player, 'home')}/></div>))}
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
                        onChange={stateChanged(async (newScore: string) => await scoreChanged(newScore, 'home'))}/>)}
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
                        onChange={stateChanged(async (newScore: string) => scoreChanged(newScore, 'away'))}/>)}
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
                            onChange={(_, player: ISelectablePlayer) => playerChanged(index, player, 'away')}/>
                    </div>))}
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
