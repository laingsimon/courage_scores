import React, {useState} from 'react';
import {PlayerSelection} from "./PlayerSelection";

export function MultiPlayerSelection(props) {
    let index = 0;
    const [player, setPlayer] = useState(null);

    function addPlayer() {
        if (player) {
            props.onAddPlayer(player);
            setPlayer(null);
            return;
        }

        alert('Ensure a player is selected first');
    }

    return (<div>
        {(props.players || []).map(p => { index++; return (<button
            disabled={props.disabled}
            key={index}
            className={`badge badge-pill ${props.disabled ? 'bg-secondary' : 'bg-primary'}`}
            onClick={() => props.onRemovePlayer(p.id, index - 1)}>
        {p.name} {props.disabled ? '' : '×'}
        </button>); })}
        <PlayerSelection
            disabled={props.disabled}
            players={props.allPlayers}
            selected={player}
            onChange={(elem, p) => setPlayer(p)} />
        <button disabled={props.disabled} onClick={addPlayer} className={`btn ${props.disabled ? 'btn-secondary' : 'btn-primary'}`}>+</button>
    </div>);
}