import React, {useState} from 'react';
import {Dialog} from "../common/Dialog";
import {EditPlayerDetails} from "./EditPlayerDetails";
import {Link} from "react-router-dom";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {propChanged} from "../../Utilities";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";

export function DivisionPlayer({ player, hideVenue }) {
    const { account, reloadTeams } = useApp();
    const { id: divisionId, season, onReloadDivision } = useDivisionData();
    const [ playerDetails, setPlayerDetails ] = useState(Object.assign({}, player));
    const [ editPlayer, setEditPlayer ] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const isAdmin = account && account.access && account.access.managePlayers;
    const team = {
        id: player.teamId,
        name: player.team
    };
    const { playerApi } = useDependencies();

    async function playerDetailSaved() {
        await onReloadDivision();
        await reloadTeams();
        setEditPlayer(false);
    }

    function renderEditPlayer() {
        return (<Dialog title={`Edit player: ${player.name}`}>
            <EditPlayerDetails
                gameId={null}
                {...playerDetails}
                team={team}
                seasonId={season.id}
                divisionId={divisionId}
                onCancel={() => setEditPlayer(false)}
                onChange={propChanged(playerDetails, setPlayerDetails)}
                onSaved={playerDetailSaved}
            />
        </Dialog>)
    }

    async function deletePlayer() {
        if (deleting) {
            /* istanbul ignore next */
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${player.name}?`)) {
            return;
        }

        setDeleting(true);
        try {
            const response = await playerApi.delete(season.id, player.teamId, player.id);
            if (response.success) {
                await onReloadDivision();
                await reloadTeams();
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
            {isAdmin ? (<button disabled={deleting} onClick={() => setEditPlayer(true)} className="btn btn-sm btn-primary margin-right">✏️</button>) : null}
            {isAdmin ? (<button disabled={deleting} onClick={deletePlayer} className="btn btn-sm btn-danger margin-right">
                {deleting ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : '🗑️'}
            </button>) : null}
            {deleting ? (<s>{player.name}</s>) : (<Link to={`/division/${divisionId}/player:${player.id}/${season.id}`}>{player.captain ? (<span>🤴 </span>) : null}{player.name}</Link>)}
            {editPlayer && isAdmin ? renderEditPlayer() : null}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)}
                                        title="Could not delete player"/>) : null}
        </td>
        {hideVenue
            ? null
            : (<td>
                {team.id === '00000000-0000-0000-0000-000000000000'
                    ? (<span className="text-warning">{player.team}</span>)
                    : (<Link disabled={deleting} to={`/division/${divisionId}/team:${team.id}/${season.id}`} className="margin-right">
                        {deleting ? (<s>{player.team}</s>) : player.team}
                    </Link>)}
            </td>)}
        <td>{player.singles.matchesPlayed}</td>
        <td>{player.singles.matchesWon}</td>
        <td>{player.singles.matchesLost}</td>
        <td>{player.points}</td>
        <td>{player.winPercentage}</td>
        <td>{player.oneEighties}</td>
        <td>{player.over100Checkouts}</td>
    </tr>);
}
