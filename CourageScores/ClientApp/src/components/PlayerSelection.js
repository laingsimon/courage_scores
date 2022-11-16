import React from 'react';
import {BootstrapDropdown} from "./BootstrapDropdown";

export function PlayerSelection({ players, disabled, selected, onChange, except }) {
    const empty = {
        value: '',
        text: (<span>&nbsp;</span>)
    };

    function findPlayer(playerId) {
        if (!playerId) {
            return null;
        }

        return players.filter(p => p.id === playerId)[0];
    }

    return (<BootstrapDropdown
        disabled={disabled}
        value={(selected || {}).id || ''}
        className="margin-right"
        onChange={(value) => { onChange(this, findPlayer(value)); }}
        options={[empty].concat(players.filter(p => (except || []).indexOf(p.id) === -1)
                .map(p => { return { value: p.id, text: p.name } })) }
    />);
}