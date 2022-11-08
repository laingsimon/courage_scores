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
        <ol>
            {(props.players || []).map(p => { index++; return (<li key={index}><button
                disabled={props.disabled}
                className={`badge badge-pill ${props.disabled ? 'bg-secondary' : 'bg-primary'} margin-right`}
                onClick={() => props.onRemovePlayer(p.id, index - 1)}>
            {p.name} {props.disabled ? '' : '×'}
            </button></li>); })}
        </ol>
        <div>
            <PlayerSelection
                disabled={props.disabled}
                players={props.allPlayers}
                selected={player}
                onChange={(elem, p) => setPlayer(p)} />
            <button disabled={props.disabled} onClick={addPlayer} className={`badge ${props.disabled ? 'btn-secondary' : 'btn-primary'}`}>+</button>
        </div>
    </div>);
}