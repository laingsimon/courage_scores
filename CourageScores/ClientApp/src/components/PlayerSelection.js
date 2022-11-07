import React from 'react';

export function PlayerSelection(props) {
    function findPlayer(playerId) {
        if (!playerId) {
            return null;
        }

        return props.players.filter(p => p.id === playerId)[0];
    }

    return (<select value={(props.selected || {}).id} onChange={(event) => props.onChange(this, findPlayer(event.target.value))}>
        <option></option>
        {props.players.filter(p => (props.except || []).indexOf(p.id) === -1).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
    </select>)
}