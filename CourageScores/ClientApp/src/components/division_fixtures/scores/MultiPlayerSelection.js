import React, {useState} from 'react';
import {PlayerSelection} from "../../division_players/PlayerSelection";
import {Link} from "react-router-dom";
import {any} from "../../../helpers/collections";
import {useApp} from "../../../AppContainer";

export function MultiPlayerSelection({ onAddPlayer, players, disabled, allPlayers, onRemovePlayer, readOnly,
                                         showNotes, notesClassName, dropdownClassName, placeholder, season, division }) {
    const [player, setPlayer] = useState(null);
    const [notes, setNotes] = useState('');
    const { onError, teams } = useApp();

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

    function playerName(player) {
        const notes = player.notes;
        player = allPlayers.filter(p => p.id === player.id)[0] || player

        if (showNotes) {
            return `${player.name} (${notes})`;
        }

        return player.name;
    }

    function renderLinkToPlayer(p) {
        if (division && season) {
            const teamName = getTeamName(p.id);
            const playerLink = teamName ? `${p.name}@${teamName}` : p.id;

            return (<Link to={`/division/${division.name}/player:${playerLink}/${season.name}`}>{playerName(p)}</Link>);
        }

        return playerName(p);
    }

    function getTeamName(playerId) {
        const team = teams.filter(t => {
            const teamSeason = t.seasons.filter(ts => ts.seasonId === season.id)[0];
            if (!teamSeason) {
                return null;
            }

            return any(teamSeason.players, p => p.id === playerId);
        })[0];

        return team ? team.name : null;
    }

    try {
        return (<div>
            <ol className="no-list-indent mb-0">
                {(players || []).map((p, playerIndex) => {
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
                        onChange={(elem, p) => setPlayer(p)}
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
