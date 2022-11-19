import React, {useState} from 'react';
import {PlayerSelection} from "./PlayerSelection";

export function MultiPlayerSelection({ onAddPlayer, players, disabled, allPlayers, onRemovePlayer, readOnly }) {
    let index = 0;
    const [player, setPlayer] = useState(null);

    function addPlayer() {
        if (player) {
            onAddPlayer(player);
            setPlayer(null);
            return;
        }

        alert('Ensure a player is selected first');
    }

    return (<div>
        <ol>
            {(players || []).map(p => { index++; return (<li key={index}>{disabled ? <span>{p.name}</span> : (<button
                disabled={disabled || readOnly}
                className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'} margin-right`}
                onClick={() => onRemovePlayer(p.id, index - 1)}>
            {p.name} {disabled ? '' : '×'}
            </button>)}</li>); })}
        </ol>
        {disabled ? null : (<div>
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
