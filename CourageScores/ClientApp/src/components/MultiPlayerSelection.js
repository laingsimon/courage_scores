import React, {useState} from 'react';
import {PlayerSelection} from "./PlayerSelection";

export function MultiPlayerSelection({ onAddPlayer, players, disabled, allPlayers, onRemovePlayer, readOnly, showNotes }) {
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

    function renderPlayer(player) {
        const notes = player.notes;
        player = allPlayers.filter(p => p.id === player.id)[0] || player

        if (showNotes) {
            return `${player.name} (${notes})`;
        }

        return player.name;
    }

    return (<div>
        <ol>
            {(players || []).map(p => {
                index++;
                return (<li key={index}>{disabled ? <span>{renderPlayer(p)}</span> : (<button
                    disabled={disabled || readOnly}
                    className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'} margin-right`}
                    onClick={async () => onRemovePlayer ? await onRemovePlayer(p.id, index - 1) : null}>
                    {renderPlayer(p)} {disabled ? '' : '🗑'}
                </button>)}</li>);
            })}
        </ol>
        {disabled ? null : (<div>
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
                    className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'}`}>💾
            </button>
        </div>)}
    </div>);
}
