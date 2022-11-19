import React, { useState } from 'react';
import {EditPlayerDetails} from "./EditPlayerDetails";
import {TeamApi} from "../api/team";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import {PlayerApi} from "../api/player";
import {ErrorDisplay} from "./ErrorDisplay";

export function DivisionPlayers({ divisionData, account, onReloadDivision }) {
    const isAdmin = account && account.access && account.access.managePlayers;
    const [ editPlayer, setEditPlayer ] = useState(null);
    const [ loadingPlayerDetails, setLoadingPlayerDetails ] = useState(null);
    const [ deletingPlayer, setDeletingPlayer ] = useState(null);
    const [ deleteError, setDeleteError ] = useState(null);

    async function prepareDeletePlayer(player) {
        if (loadingPlayerDetails) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${player.name} from ${player.team}?`)) {
            return;
        }

        try {
            setDeletingPlayer(player.id);
            const api = new PlayerApi(new Http(new Settings()));
            const result = await api.delete(player.teamId, player.id);

            if (result.success) {
                await onReloadDivision();
            } else {
                setDeleteError(result);
            }
        } finally {
            setDeletingPlayer(null);
        }
    }

    async function openEditPlayer(player) {
        if (loadingPlayerDetails) {
            return;
        }

        if (editPlayer != null && editPlayer.id === player.id) {
            setEditPlayer(null);
            return;
        }

        const api = new TeamApi(new Http(new Settings()));
        setLoadingPlayerDetails(player.id);
        const teamResult = await api.get(player.teamId);
        const teamSeason = teamResult.seasons.filter(s => s.seasonId === divisionData.season.id)[0];
        const playerResult = teamSeason.players.filter(p => p.id === player.id)[0];
        playerResult.teamId = player.teamId;

        setEditPlayer(playerResult);
        setLoadingPlayerDetails(null);
    }

    return (<div className="light-background p-3">
        <div className="overflow-auto max-scroll-height">
            <table className="table">
                <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Venue</th>
                    <th>Won</th>
                    <th>Lost</th>
                    <th>Points</th>
                    <th>Win %</th>
                    <th>180s</th>
                    <th>hi-check</th>
                    {(isAdmin) ? (<th></th>) : null}
                </tr>
                </thead>
                <tbody>
                {divisionData.players.map(p => (<tr key={p.id} className={(editPlayer != null && editPlayer.teamId === p.teamId) ? 'highlight-row' : null}>
                    <td>{p.rank}</td>
                    <td>{p.captain ? (<span>🤴 </span>) : null}{p.name}</td>
                    <td>{p.team}</td>
                    <td>{p.won}</td>
                    <td>{p.lost}</td>
                    <td>{p.points}</td>
                    <td>{p.winPercentage}</td>
                    <td>{p.oneEighties}</td>
                    <td>{p.over100Checkouts}</td>
                    {(isAdmin) ? (<td className="text-nowrap">
                        {(loadingPlayerDetails === null && editPlayer === null && deletingPlayer !== p.id) || (editPlayer != null && editPlayer.id === p.id) || loadingPlayerDetails === p.id ? (<button className={`btn btn-sm ${loadingPlayerDetails === p.id || loadingPlayerDetails === null ? 'btn-primary' : 'btn-secondary'}`} onClick={() => openEditPlayer(p)}>
                            {loadingPlayerDetails === p.id ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : '✏'}
                        </button>) : (<button className="btn btn-sm btn-light" style={{ visibility: 'hidden' }}>✏</button>)}
                        {(loadingPlayerDetails === null && editPlayer === null) || (editPlayer != null && editPlayer.id === p.id) || loadingPlayerDetails === p.id ? (<button className="btn btn-sm" onClick={() => prepareDeletePlayer(p)}>{deletingPlayer === p.id ? (<span className="spinner-border spinner-border-sm text-danger" role="status" aria-hidden="true"></span>) : '❌'}</button>) : null}
                    </td>) : null}
                </tr>))}
                </tbody>
            </table>
        </div>
        {editPlayer ? (<div className="mt-3"><EditPlayerDetails {...editPlayer}
                                       divisionData={divisionData}
                                       onChange={(name, value) => {
                                           const newData = {};
                                           newData[name] = value;
                                           setEditPlayer(Object.assign({}, editPlayer, newData))
                                       } }
                                       onSaved={async () => { await onReloadDivision(); setEditPlayer(null); }}
                                       onCancel={() => setEditPlayer(null)} /></div>) : null}
        {(isAdmin) && editPlayer == null && loadingPlayerDetails === null ? (<button className="btn btn-primary mt-3" onClick={() => setEditPlayer({})}>
            Add player
        </button>) : null}
        {deleteError ? (<ErrorDisplay {...deleteError} onClose={() => setDeleteError(null)} title="Could not delete player" />) : null}
    </div>);
}
