import {useState} from 'react';
import {ISelectablePlayer, PlayerSelection} from "./PlayerSelection";
import {any} from "../../helpers/collections";
import {useApp} from "./AppContainer";
import {EmbedAwareLink} from "./EmbedAwareLink";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {NotablePlayerDto} from "../../interfaces/models/dtos/Game/NotablePlayerDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {GamePlayerDto} from "../../interfaces/models/dtos/Game/GamePlayerDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";

export interface IMultiPlayerSelectionProps {
    onAddPlayer?(player: ISelectablePlayer, score: number): Promise<any>;
    players?: NotablePlayerDto[] | TeamPlayerDto[] | GamePlayerDto[];
    disabled?: boolean;
    allPlayers: ISelectablePlayer[];
    onRemovePlayer?(playerId: string, playerIndex: number): Promise<any>;
    readOnly?: boolean;
    showScore?: boolean;
    scoreClassName?: string;
    dropdownClassName?: string;
    placeholder?: string;
    season?: SeasonDto;
    division?: DivisionDto;
}

export function MultiPlayerSelection({
                                         onAddPlayer, players, disabled, allPlayers, onRemovePlayer, readOnly,
                                         showScore, scoreClassName, dropdownClassName, placeholder, season, division
                                     }: IMultiPlayerSelectionProps) {
    const [player, setPlayer] = useState<ISelectablePlayer | null>(null);
    const [score, setScore] = useState<string>('');
    const {onError, teams} = useApp();

    async function addPlayer() {
        if (!player) {
            window.alert('Ensure a player is selected first');
            return;
        }

        const validScore = Number.parseInt(score);
        if (showScore && (!score || !Number.isFinite(validScore))) {
            window.alert('Enter the score first');
            return;
        }

        try {
            if (onAddPlayer) {
                await onAddPlayer(player, validScore);
            }
            setPlayer(null);
            setScore('');
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function playerName(player: NotablePlayerDto) {
        const lookupPlayer = allPlayers.filter((p: NotablePlayerDto) => p.id === player.id)[0] || player

        if (showScore) {
            return `${lookupPlayer.name} (${player.score})`;
        }

        return lookupPlayer.name;
    }

    function renderLinkToPlayer(p: NotablePlayerDto) {
        if (division && season) {
            const teamName: string = getTeamName(p.id);
            const playerLink: string = teamName ? `${p.name}@${teamName}` : p.id;

            return (<EmbedAwareLink
                to={`/division/${division.name}/player:${playerLink}/${season.name}`}>{playerName(p)}</EmbedAwareLink>);
        }

        return playerName(p);
    }

    function getTeamName(playerId: string): string {
        const team: TeamDto = teams.filter(t => {
            const teamSeason: TeamSeasonDto = t.seasons.filter((ts: TeamSeasonDto) => ts.seasonId === season.id && !ts.deleted)[0];
            if (!teamSeason) {
                return null;
            }

            return any(teamSeason.players, (p: TeamPlayerDto) => p.id === playerId);
        })[0];

        return team ? team.name : null;
    }

    try {
        return (<div>
            <ol className="no-list-indent mb-0">
                {(players || []).map((p: NotablePlayerDto, playerIndex: number) => {
                    return (<li key={playerIndex}>{disabled ? renderLinkToPlayer(p) : (<button
                        disabled={disabled || readOnly}
                        className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'} margin-right`}
                        onClick={async () => onRemovePlayer ? await onRemovePlayer(p.id, playerIndex - 1) : null}>
                        {playerName(p)} {disabled ? '' : '🗑'}
                    </button>)}</li>);
                })}
                {disabled || readOnly ? null : (<li>
                    {showScore ? (<input
                        disabled={disabled}
                        readOnly={readOnly}
                        onChange={(elem) => setScore(elem.target.value)}
                        value={score}
                        className={`margin-right tri-character-input align-middle${scoreClassName || ''}`}
                        type="number"
                        min="100"
                        max="120"/>) : null}
                    {any(allPlayers) ? (<PlayerSelection
                        disabled={disabled}
                        readOnly={readOnly}
                        players={allPlayers}
                        selected={player}
                        onChange={async (_, p: ISelectablePlayer) => setPlayer(p)}
                        className={dropdownClassName}
                        placeholder={placeholder}/>) : null}
                    {any(allPlayers) ? (<button disabled={disabled || readOnly} onClick={addPlayer}
                                                className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-outline-primary'}`}>➕
                    </button>) : null}
                </li>)}
            </ol>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
