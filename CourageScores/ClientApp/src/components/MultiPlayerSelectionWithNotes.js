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
        <ol>
            {(props.players || []).map(p => { index++; return (<li key={index}>{props.disabled ? null : (<button
                disabled={props.disabled}
                className={`badge badge-pill ${props.disabled ? 'bg-secondary' : 'bg-primary'} margin-right`}
                onClick={() => props.onRemovePlayer(p.id, index - 1)}>
            {p.name} ({p.notes}) {props.disabled ? '' : '×'}
            </button>)}</li>); })}
        </ol>
        {props.disabled ? null (<div>
            <input
                disabled={props.disabled}
                onChange={(elem) => setNotes(elem.target.value)}
                value={notes}
                className="margin-right"
                type="number"
                min="100"
                max="120" />
            <PlayerSelection
                disabled={props.disabled}
                players={props.allPlayers}
                selected={player}
                onChange={(elem, p) => setPlayer(p)} />
            <button disabled={props.disabled} onClick={addPlayer} className={`badge ${props.disabled ? 'btn-secondary' : 'btn-primary'}`}>+</button>
        </div>)}
    </div>);
}
