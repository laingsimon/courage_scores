import React, {useState} from 'react';
import {BootstrapDropdown} from "./BootstrapDropdown";
import {Dialog} from "./Dialog";
import {EditPlayerDetails} from "./EditPlayerDetails";

export function PlayerSelection({ players, disabled, selected, onChange, except, readOnly, allowEdit, onEdit, teamId, seasonId, gameId }) {
    const empty = {
        value: '',
        text: (<span>&nbsp;</span>)
    };
    const [ playerDetails, setPlayerDetails ] = useState(null);
    const [ editPlayer, setEditPlayer ] = useState(false);

    function findPlayer(playerId) {
        if (!playerId) {
            return null;
        }

        return players.filter(p => p.id === playerId)[0];
    }

    function beginEditPlayer() {
        if (!selected || !selected.id) {
            return;
        }

        const playerDetails = Object.assign({}, selected);
        setPlayerDetails(playerDetails);
        setEditPlayer(true);
    }

    function updatePlayerDetails(prop, value) {
        const newPlayerDetails = Object.assign({}, playerDetails);
        newPlayerDetails[prop] = value;
        setPlayerDetails(newPlayerDetails);
    }

    async function playerUpdated() {
        if (onEdit) {
            await onEdit();
        }
        setEditPlayer(false);
    }

    function renderEditPlayer() {
        return (<Dialog title="Edit player">
            <EditPlayerDetails
                id={playerDetails.id}
                name={playerDetails.name}
                captain={playerDetails.captain}
                onCancel={() => setEditPlayer(null)}
                onChange={updatePlayerDetails}
                onSaved={playerUpdated}
                teamId={teamId}
                seasonId={seasonId}
                teams={null}
                gameId={gameId}
            />
        </Dialog>);
    }

    return (<div>
        {editPlayer && teamId && seasonId ? renderEditPlayer() : null}
        {allowEdit ? (<button
            disabled={!teamId || !seasonId || (!(selected || {}).id)}
            className={`btn btn-sm ${teamId && seasonId && (selected || {}).id ? 'btn-primary' : 'btn-secondary'} margin-right`}
            onClick={beginEditPlayer}>✏</button>) : null}
        <BootstrapDropdown
            disabled={disabled}
            readOnly={readOnly}
            value={(selected || {}).id || ''}
            className="margin-right"
            onChange={async (value) => onChange ? await onChange(this, findPlayer(value)) : null}
            options={[empty].concat(players.filter(p => (except || []).indexOf(p.id) === -1)
                    .map(p => { return { value: p.id, text: p.name } })) } />
    </div>);
}