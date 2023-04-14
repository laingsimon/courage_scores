import React from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";

export function PlayerSelection({ players, disabled, selected, onChange, except, readOnly, className, placeholder }) {
    const empty = {
        value: '',
        text: placeholder ? (<span>{placeholder}</span>) : (<span>&nbsp;</span>),
        className: 'text-warning'
    };

    function findPlayer(playerId) {
        if (!playerId) {
            return null;
        }

        return players.filter(p => p.id === playerId)[0];
    }

    return (<span>
        <BootstrapDropdown
            disabled={disabled}
            readOnly={readOnly}
            className={className}
            value={(selected || {}).id || ''}
            onChange={async (value) => onChange ? await onChange(this, findPlayer(value)) : null}
            options={[empty].concat(players.filter(p => (except || []).indexOf(p.id) === -1)
                    .map(p => { return { value: p.id, text: p.name } })) } />
    </span>);
}
