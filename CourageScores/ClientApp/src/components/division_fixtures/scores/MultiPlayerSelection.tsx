import React, {useState} from 'react';
import {ISelectablePlayer, PlayerSelection} from "../../division_players/PlayerSelection";
import {any} from "../../../helpers/collections";
import {useApp} from "../../../AppContainer";
import {EmbedAwareLink} from "../../common/EmbedAwareLink";
import {ITeamPlayerDto} from "../../../interfaces/dtos/Team/ITeamPlayerDto";
import {INotablePlayerDto} from "../../../interfaces/dtos/Game/INotablePlayerDto";
import {ITeamDto} from "../../../interfaces/dtos/Team/ITeamDto";
import {ITeamSeasonDto} from "../../../interfaces/dtos/Team/ITeamSeasonDto";
import {IGamePlayerDto} from "../../../interfaces/dtos/Game/IGamePlayerDto";
import {ISeasonDto} from "../../../interfaces/dtos/Season/ISeasonDto";
import {IDivisionDto} from "../../../interfaces/dtos/IDivisionDto";

export interface IMultiPlayerSelectionProps {
    onAddPlayer?: (player: ISelectablePlayer, notes: string) => Promise<any>;
    players?: INotablePlayerDto[] | ITeamPlayerDto[] | IGamePlayerDto[];
    disabled?: boolean;
    allPlayers: ISelectablePlayer[];
    onRemovePlayer?: (playerId: string, playerIndex: number) => Promise<any>;
    readOnly?: boolean;
    showNotes?: boolean;
    notesClassName?: string;
    dropdownClassName?: string;
    placeholder?: string;
    season?: ISeasonDto;
    division?: IDivisionDto;
}

export function MultiPlayerSelection({
                                         onAddPlayer, players, disabled, allPlayers, onRemovePlayer, readOnly,
                                         showNotes, notesClassName, dropdownClassName, placeholder, season, division
                                     }: IMultiPlayerSelectionProps) {
    const [player, setPlayer] = useState<ISelectablePlayer | null>(null);
    const [notes, setNotes] = useState<string>('');
    const {onError, teams} = useApp();

    async function addPlayer() {
        if (!player) {
            window.alert('Ensure a player is selected first');
            return;
        }

        if (showNotes && !notes) {
            window.alert('Enter the score first');
            return;
        }

        try {
            if (onAddPlayer) {
                await onAddPlayer(player, notes);
            }
            setPlayer(null);
            setNotes('');
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function playerName(player: INotablePlayerDto) {
        const notes: string = player.notes;
        player = allPlayers.filter((p: INotablePlayerDto) => p.id === player.id)[0] || player

        if (showNotes) {
            return `${player.name} (${notes})`;
        }

        return player.name;
    }

    function renderLinkToPlayer(p: INotablePlayerDto) {
        if (division && season) {
            const teamName: string = getTeamName(p.id);
            const playerLink: string = teamName ? `${p.name}@${teamName}` : p.id;

            return (<EmbedAwareLink
                to={`/division/${division.name}/player:${playerLink}/${season.name}`}>{playerName(p)}</EmbedAwareLink>);
        }

        return playerName(p);
    }

    function getTeamName(playerId: string): string {
        const team: ITeamDto = teams.filter(t => {
            const teamSeason: ITeamSeasonDto = t.seasons.filter((ts: ITeamSeasonDto) => ts.seasonId === season.id)[0];
            if (!teamSeason) {
                return null;
            }

            return any(teamSeason.players, (p: ITeamPlayerDto) => p.id === playerId);
        })[0];

        return team ? team.name : null;
    }

    try {
        return (<div>
            <ol className="no-list-indent mb-0">
                {(players || []).map((p: INotablePlayerDto, playerIndex: number) => {
                    return (<li key={playerIndex}>{disabled ? renderLinkToPlayer(p) : (<button
                        disabled={disabled || readOnly}
                        className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'} margin-right`}
                        onClick={async () => onRemovePlayer ? await onRemovePlayer(p.id, playerIndex - 1) : null}>
                        {playerName(p)} {disabled ? '' : '🗑'}
                    </button>)}</li>);
                })}
                {disabled || readOnly ? null : (<li>
                    {showNotes ? (<input
                        disabled={disabled}
                        readOnly={readOnly}
                        onChange={(elem) => setNotes(elem.target.value)}
                        value={notes}
                        className={`margin-right tri-character-input align-middle${notesClassName || ''}`}
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
