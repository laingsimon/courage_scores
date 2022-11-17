import React, {useState} from 'react';
import {PlayerSelection} from "./PlayerSelection";

export function MultiPlayerSelection({ onAddPlayer, players, disabled, allPlayers, onRemovePlayer }) {
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
            {(players || []).map(p => { index++; return (<li key={index}>{disabled ? null : (<button
                disabled={disabled}
                className={`badge badge-pill ${disabled ? 'bg-secondary' : 'bg-primary'} margin-right`}
                onClick={() => onRemovePlayer(p.id, index - 1)}>
            {p.name} {disabled ? '' : '×'}
            </button>)}</li>); })}
        </ol>
        {disabled ? null : (<div>
            <PlayerSelection
                disabled={disabled}
                players={allPlayers}
                selected={player}
                onChange={(elem, p) => setPlayer(p)} />
            <button disabled={disabled} onClick={addPlayer} className={`btn btn-sm ${disabled ? 'btn-secondary' : 'btn-primary'}`}>+</button>
        </div>)}
    </div>);
}
