import React, {useState} from 'react';
import {KnockoutApi} from "../../api/knockout";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown} from "../common/BootstrapDropdown";

export function NewKnockoutGame({ date, onNewKnockout, teams, divisionId, seasonId }) {
    const [ creating, setCreating ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const [ address, setAddress ] = useState('');

    async function createKnockoutGame() {
        if (creating) {
            return;
        }

        try {
            setCreating(true);

            const api = new KnockoutApi(new Http(new Settings()));
            const response = await api.update({
                date: date,
                address: address,
                seasonId: seasonId
            });

            if (response.success) {
                if (onNewKnockout) {
                    await onNewKnockout();
                }
            } else {
                setSaveError(response);
            }
        } finally {
            setCreating(false);
        }
    }

    function getAddresses() {
        const addresses = { };

        teams.forEach(team => {
           if (addresses[team.address]) {
               addresses[team.address].push(team.name);
           } else {
               addresses[team.address] = [ team.name ];
           }
        });

        return Object.keys(addresses).map(address => { return {
            value: address,
            text: `${address} (${addresses[address].join(', ')})` }; });
    }

    return (<tr>
        <td colSpan="6">
            <BootstrapDropdown
                options={getAddresses()}
                value={address}
                onChange={(address) => setAddress(address)}
                readOnly={creating}
                className="margin-right" />
            <button className="btn btn-primary" onClick={createKnockoutGame}>
                {creating ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🎖'}
                Reserve for knockout
            </button>
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save fixture details" />) : null}
        </td>
    </tr>)
}
