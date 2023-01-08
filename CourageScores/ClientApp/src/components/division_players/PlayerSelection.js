import React, {useState} from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {Dialog} from "../common/Dialog";
import {EditPlayerDetails} from "./EditPlayerDetails";
import {PlayerApi} from "../../api/player";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ErrorDisplay} from "../common/ErrorDisplay";

export function PlayerSelection({ players, disabled, selected, onChange, except, readOnly, allowEdit, onEdit, teamId, seasonId, gameId, allowDelete, onDelete, className }) {
    const empty = {
        value: '',
        text: (<span>&nbsp;</span>)
    };
    const [ playerDetails, setPlayerDetails ] = useState(null);
    const [ editPlayer, setEditPlayer ] = useState(false);
    const [ deletingPlayer, setDeletingPlayer ] = useState(false);
    const [ deleteError, setDeleteError ] = useState(null);

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
                {...playerDetails}
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

    async function deletePlayer() {
        if (deletingPlayer) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selected.name}?`)) {
            return;
        }

        setDeletingPlayer(true);
        try {
            const api = new PlayerApi(new Http(new Settings()));
            const response = await api.delete(seasonId, teamId, selected.id);

            if (response.success) {
                if (onDelete) {
                    await onDelete();
                }
            } else {
                setDeleteError(response);
            }
        } finally {
            setDeletingPlayer(false);
        }
    }

    return (<span>
        {editPlayer && teamId && seasonId ? renderEditPlayer() : null}
        {allowDelete ? (<button
            disabled={!teamId || !seasonId || (!(selected || {}).id) || deletingPlayer}
            className={`btn btn-sm ${teamId && seasonId && (selected || {}).id && !deletingPlayer ? 'btn-danger' : 'btn-secondary'} margin-right`}
            onClick={deletePlayer}>
                {deletingPlayer ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🗑'}
        </button>) : null}
        {allowEdit ? (<button
            disabled={!teamId || !seasonId || (!(selected || {}).id)}
            className={`btn btn-sm ${teamId && seasonId && (selected || {}).id ? 'btn-primary' : 'btn-secondary'} margin-right`}
            onClick={beginEditPlayer}>✏</button>) : null}
        <BootstrapDropdown
            disabled={disabled}
            readOnly={readOnly}
            className={className}
            value={(selected || {}).id || ''}
            onChange={async (value) => onChange ? await onChange(this, findPlayer(value)) : null}
            options={[empty].concat(players.filter(p => (except || []).indexOf(p.id) === -1)
                    .map(p => { return { value: p.id, text: p.name } })) } />
        {deleteError ? (<ErrorDisplay {...deleteError} onClose={() => setDeleteError(null)} title="Could not delete player" />) : null}
    </span>);
}