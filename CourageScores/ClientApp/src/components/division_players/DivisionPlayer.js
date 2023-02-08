import React, {useState} from 'react';
import {Dialog} from "../common/Dialog";
import {EditPlayerDetails} from "./EditPlayerDetails";
import {Link} from "react-router-dom";
import {PlayerApi} from "../../api/player";
import {Settings} from "../../api/settings";
import {Http} from "../../api/http";
import {ErrorDisplay} from "../common/ErrorDisplay";

export function DivisionPlayer({player, onPlayerSaved, account, seasonId, hideVenue, divisionId }) {
    const [ playerDetails, setPlayerDetails ] = useState(Object.assign({}, player));
    const [ editPlayer, setEditPlayer ] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const isAdmin = account && account.access && account.access.managePlayers;
    const team = {
        id: player.teamId,
        name: player.team
    };

    function playerDetailChanged(prop, value) {
        const newDetails = Object.assign({}, playerDetails);
        newDetails[prop] = value;
        setPlayerDetails(newDetails);
    }

    async function playerDetailSaved() {
        if (onPlayerSaved) {
            await onPlayerSaved();
        }

        setEditPlayer(false);
    }

    function renderEditPlayer() {
        return (<Dialog title={`Edit player: ${player.name}`}>
            <EditPlayerDetails
                gameId={null}
                {...playerDetails}
                teamId={team.id}
                teams={[ team ]}
                seasonId={seasonId}
                onCancel={() => setEditPlayer(false)}
                onChange={playerDetailChanged}
                onSaved={playerDetailSaved}
            />
        </Dialog>)
    }

    async function deletePlayer() {
        if (deleting) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${player.name}?`)) {
            return;
        }

        setDeleting(true);
        try {
            const api = new PlayerApi(new Http(new Settings()));

            const response = await api.delete(seasonId, player.teamId, player.id);
            if (response.success) {
                if (onPlayerSaved) {
                    await onPlayerSaved();
                }
            } else {
                setSaveError(response);
            }
        } finally {
            setDeleting(false);
        }
    }

    return (<tr>
        <td>{player.rank}</td>
        <td>
            {isAdmin && onPlayerSaved ? (<button disabled={deleting} onClick={() => setEditPlayer(true)} className="btn btn-sm btn-primary margin-right">✏️</button>) : null}
            {isAdmin && onPlayerSaved ? (<button disabled={deleting} onClick={deletePlayer} className="btn btn-sm btn-danger margin-right">
                {deleting ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : '🗑️'}
            </button>) : null}
            {deleting ? (<s>{player.name}</s>) : (<Link to={`/division/${divisionId}/player:${player.id}/${seasonId}`}>{player.captain ? (<span>🤴 </span>) : null}{player.name}</Link>)}
            {editPlayer && isAdmin && onPlayerSaved ? renderEditPlayer() : null}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)}
                                        title="Could not delete player"/>) : null}
        </td>
        {hideVenue
            ? null
            : (<td>
                {team.id === '00000000-0000-0000-0000-000000000000'
                    ? (<span className="text-warning">{player.team}</span>)
                    : (<Link disabled={deleting} to={`/division/${divisionId}/team:${team.id}/${seasonId}`} className="margin-right">
                        {deleting ? (<s>{player.team}</s>) : player.team}
                    </Link>)}
            </td>)}
        <td>{player.played}</td>
        <td>{player.won}</td>
        <td>{player.lost}</td>
        <td>{player.points}</td>
        <td>{player.winPercentage}</td>
        <td>{player.oneEighties}</td>
        <td>{player.over100Checkouts}</td>
    </tr>);
}
