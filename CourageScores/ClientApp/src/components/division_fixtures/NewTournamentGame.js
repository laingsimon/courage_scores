import React, {useState} from 'react';
import {TournamentApi} from "../../api/tournament";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown} from "../common/BootstrapDropdown";

export function NewTournamentGame({ date, onNewTournament, teams, seasonId }) {
    const [ creating, setCreating ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const [ address, setAddress ] = useState('');

    async function createTournamentGame() {
        if (creating) {
            return;
        }

        try {
            setCreating(true);

            const api = new TournamentApi(new Http(new Settings()));
            const teamsAtAddress = teams.filter(t => t.address === address).map(t => t.name).join(', ');
            const response = await api.update({
                date: date,
                address: teamsAtAddress,
                seasonId: seasonId
            });

            if (response.success) {
                if (onNewTournament) {
                    await onNewTournament();
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
               addresses[team.address].push(team);
           } else {
               addresses[team.address] = [ team ];
           }
        });

        return Object.keys(addresses).map(address => { return {
            value: address,
            text: `${address} (${addresses[address].map(t => t.name).join(', ')})` }; });
    }

    return (<tr>
        <td colSpan="5">
            <BootstrapDropdown
                options={getAddresses()}
                value={address}
                onChange={(address) => setAddress(address)}
                readOnly={creating}
                className="margin-right" />
        </td>
        <td className="medium-column-width">
            <button className="btn btn-primary text-nowrap" onClick={createTournamentGame}>
                {creating ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🎖'}
                Reserve
            </button>
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save tournament details" />) : null}
        </td>
    </tr>)
}
