import React, {useState} from 'react';
import {Dialog} from "../common/Dialog";
import {EditPlayerDetails} from "./EditPlayerDetails";

export function DivisionPlayer({player, onPlayerSaved, account, seasonId, teamId }) {
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
            {isAdmin ? (<button onClick={() => setEditPlayer(true)} className="btn btn-sm btn-primary margin-right">✏️</button>) : null}
            {player.captain ? (<span>🤴 </span>) : null}{player.name}
            {editPlayer && isAdmin ? renderEditPlayer() : null}
        </td>
        <td>{player.team}</td>
        <td>{player.won}</td>
        <td>{player.lost}</td>
        <td>{player.points}</td>
        <td>{player.winPercentage}</td>
        <td>{player.oneEighties}</td>
        <td>{player.over100Checkouts}</td>
    </tr>);
}
