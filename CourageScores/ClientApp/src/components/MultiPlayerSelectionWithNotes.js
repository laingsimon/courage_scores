import React, {useState} from 'react';
import {PlayerSelection} from "./PlayerSelection";

export function MultiPlayerSelectionWithNotes({ onAddPlayer, players, disabled, allPlayers, onRemovePlayer, readOnly }) {
    let index = 0;
    const [player, setPlayer] = useState(null);
    const [notes, setNotes] = useState('');

    function addPlayer() {
        if (player) {
            onAddPlayer(player, notes);
            setPlayer(null);
            setNotes('');
            return;
        }

        alert('Ensure a player is selected first');
    }

    return (<div>
        <ol>
            {(players || []).map(p => { index++; return (<li key={index}>{disabled ? <span>{p.name} ({p.notes})</span> : (<button
                disabled={disabled || readOnly}
                className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'} margin-right`}
                onClick={() => onRemovePlayer(p.id, index - 1)}>
            {p.name} ({p.notes}) {disabled ? '' : '×'}
            </button>)}</li>); })}
        </ol>
        {disabled ? null : (<div>
            <input
                disabled={disabled}
                readOnly={readOnly}
                onChange={(elem) => setNotes(elem.target.value)}
                value={notes}
                className="margin-right"
                type="number"
                min="100"
                max="120" />
            <PlayerSelection
                disabled={disabled}
                readOnly={readOnly}
                players={allPlayers}
                selected={player}
                onChange={(elem, p) => setPlayer(p)} />
            <button disabled={disabled || readOnly} onClick={addPlayer} className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'}`}>+</button>
        </div>)}
    </div>);
}
