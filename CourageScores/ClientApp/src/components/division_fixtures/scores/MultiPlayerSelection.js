import React, {useState} from 'react';
import {PlayerSelection} from "../../division_players/PlayerSelection";
import {Link} from "react-router-dom";
import {any} from "../../../Utilities";
import {useApp} from "../../../AppContainer";

export function MultiPlayerSelection({ onAddPlayer, players, disabled, allPlayers, onRemovePlayer, readOnly, showNotes, divisionId, seasonId, notesClassName, dropdownClassName, placeholder }) {
    let index = 0;
    const [player, setPlayer] = useState(null);
    const [notes, setNotes] = useState('');
    const { onError } = useApp();

    async function addPlayer() {
        if (!player) {
            alert('Ensure a player is selected first');
            return;
        }

        try {
            if (onAddPlayer) {
                await onAddPlayer(player, notes);
            }
            setPlayer(null);
            setNotes('');
        } catch (e) {
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
        const divId = (divisionId || p.divisionId);
        if (divId && divId !== '00000000-0000-0000-0000-000000000000' && seasonId) {
            return (<Link to={`/division/${divId}/player:${p.id}/${seasonId}`}>{playerName(p)}</Link>);
        }

        return playerName(p);
    }

    try {
        return (<div>
            <ol className="no-list-indent mb-0">
                {(players || []).map(p => {
                    index++;
                    const playerIndex = index;
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
        onError(e);
    }
}
