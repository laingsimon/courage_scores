import React, {useState} from 'react';
import {PlayerSelection} from "../../division_players/PlayerSelection";
import {Link} from "react-router-dom";

export function MultiPlayerSelection({ onAddPlayer, players, disabled, allPlayers, onRemovePlayer, readOnly, showNotes, divisionId, seasonId }) {
    let index = 0;
    const [player, setPlayer] = useState(null);
    const [notes, setNotes] = useState('');

    async function addPlayer() {
        if (player) {
            if (onAddPlayer) {
                await onAddPlayer(player, notes);
            }
            setPlayer(null);
            setNotes('');
            return;
        }

        alert('Ensure a player is selected first');
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
        if (!divisionId || !seasonId) {
            return playerName(p);
        }

        return (<Link to={`/division/${divisionId}/player:${p.id}/${seasonId}`}>{playerName(p)}</Link>);
    }

    return (<div>
        <ol>
            {(players || []).map(p => {
                index++;
                return (<li key={index}>{disabled ? renderLinkToPlayer(p) : (<button
                    disabled={disabled || readOnly}
                    className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'} margin-right`}
                    onClick={async () => onRemovePlayer ? await onRemovePlayer(p.id, index - 1) : null}>
                    {playerName(p)} {disabled ? '' : '🗑'}
                </button>)}</li>);
            })}
            {disabled ? null : (<li>
                {showNotes ? (<input
                    disabled={disabled}
                    readOnly={readOnly}
                    onChange={(elem) => setNotes(elem.target.value)}
                    value={notes}
                    className="margin-right"
                    type="number"
                    min="100"
                    max="120"/>) : null}
                <PlayerSelection
                    disabled={disabled}
                    readOnly={readOnly}
                    players={allPlayers}
                    selected={player}
                    onChange={(elem, p) => setPlayer(p)}/>
                <button disabled={disabled || readOnly} onClick={addPlayer}
                        className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-outline-primary'}`}>➕
                </button>
            </li>)}
        </ol>
    </div>);
}
