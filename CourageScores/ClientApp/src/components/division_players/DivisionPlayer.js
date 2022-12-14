import React, {useState} from 'react';
import {Dialog} from "../common/Dialog";
import {EditPlayerDetails} from "./EditPlayerDetails";
import {Link} from "react-router-dom";

export function DivisionPlayer({player, onPlayerSaved, account, seasonId, hideVenue, divisionId }) {
    const [ playerDetails, setPlayerDetails ] = useState(Object.assign({}, player));
    const [ editPlayer, setEditPlayer ] = useState(false);
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

    return (<tr>
        <td>{player.rank}</td>
        <td>
            {isAdmin && onPlayerSaved ? (<button onClick={() => setEditPlayer(true)} className="btn btn-sm btn-primary margin-right">✏️</button>) : null}
            {player.captain ? (<span>🤴 </span>) : null}{player.name}
            {editPlayer && isAdmin && onPlayerSaved ? renderEditPlayer() : null}
        </td>
        {hideVenue
            ? null
            : (<td>
                <Link to={`/division/${divisionId}/team:${team.id}/${seasonId}`} className="margin-right">{player.team}</Link>
            </td>)}
        <td>{player.won}</td>
        <td>{player.lost}</td>
        <td>{player.points}</td>
        <td>{player.winPercentage}</td>
        <td>{player.oneEighties}</td>
        <td>{player.over100Checkouts}</td>
    </tr>);
}
