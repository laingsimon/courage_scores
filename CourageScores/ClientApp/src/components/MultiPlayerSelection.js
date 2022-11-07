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
            key={index}
            className="badge badge-pill bg-primary"
            onClick={() => props.onRemovePlayer(p.id, index - 1)}>
        {p.name} &times;
        </button>); })}
        <PlayerSelection
            players={props.allPlayers}
            selected={player}
            onChange={(elem, p) => setPlayer(p)} />
        <button onClick={addPlayer} className="btn btn-primary">+</button>
    </div>);
}