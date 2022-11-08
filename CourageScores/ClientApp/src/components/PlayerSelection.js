import React from 'react';

export function PlayerSelection(props) {
    function findPlayer(playerId) {
        if (!playerId) {
            return null;
        }

        return props.players.filter(p => p.id === playerId)[0];
    }

    return (<select
            disabled={props.disabled}
            value={(props.selected || {}).id || ''}
            className="margin-right"
            onChange={(event) => { props.onChange(this, findPlayer(event.target.value)); }}>
        <option></option>
        {props.players.filter(p => (props.except || []).indexOf(p.id) === -1).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
    </select>)
}