import React, {useState} from 'react';
import {PlayerSelection} from "./PlayerSelection";

export function MultiPlayerSelectionWithNotes(props) {
    const [notes, setNotes] = useState('');
    const [player, setPlayer] = useState(null);
    let index = 0;

    function addPlayer() {
        if (player) {
            props.onAddPlayer(player, notes);
            setPlayer(null);
            setNotes('');
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
        {p.name} ({p.notes}) {props.disabled ? '' : '×'}
        </button>); })}
        <input disabled={props.disabled} onChange={(elem) => setNotes(elem.target.value)} value={notes} type="number" min="100" max="120" />
        <PlayerSelection
            disabled={props.disabled}
            players={props.allPlayers}
            selected={player}
            onChange={(elem, p) => setPlayer(p)} />
        <button disabled={props.disabled} onClick={addPlayer} className={`btn ${props.disabled ? 'btn-secondary' : 'btn-primary'}`}>+</button>
    </div>);
}