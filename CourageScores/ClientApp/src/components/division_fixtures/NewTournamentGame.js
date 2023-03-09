import React, {useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {useDependencies} from "../../IocContainer";
import {useDivisionData} from "../DivisionDataContainer";

export function NewTournamentGame({ date, onNewTournament }) {
    const { season, teams } = useDivisionData();
    const [ creating, setCreating ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const [ address, setAddress ] = useState('');
    const { tournamentApi } = useDependencies();

    async function createTournamentGame() {
        if (creating) {
            return;
        }

        try {
            setCreating(true);

            const teamsAtAddress = teams.filter(t => t.address === address).map(t => t.name).join(', ');
            const response = await tournamentApi.update({
                date: date,
                address: teamsAtAddress,
                seasonId: season.id
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
