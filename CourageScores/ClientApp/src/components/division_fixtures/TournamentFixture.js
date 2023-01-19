import React, {useState} from 'react';
import {Link} from "react-router-dom";
import {TournamentApi} from "../../api/tournament";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {nameSort} from "../../Utilities";

export function TournamentFixture({ account, tournament, onTournamentChanged, seasonId, divisionId, date, expanded }) {
    const isProposedTournament = tournament.proposed;
    const [ creating, setCreating ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const isAdmin = account && account.access && account.access.manageGames;

    async function createTournamentGame() {
        if (creating || deleting) {
            return;
        }

        try {
            setCreating(true);

            const api = new TournamentApi(new Http(new Settings()));
            const response = await api.update({
                date: date,
                address: tournament.address,
                divisionId: divisionId,
                seasonId: seasonId
            });

            if (response.success) {
                if (onTournamentChanged) {
                    await onTournamentChanged();
                }
            } else {
                setSaveError(response);
            }
        } finally {
            setCreating(false);
        }
    }

    async function deleteTournamentGame() {
        if (deleting || creating) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete this tournament fixture?`)) {
            return;
        }

        try {
            setDeleting(true);

            const api = new TournamentApi(new Http(new Settings()));
            const response = await api.delete(tournament.id);

            if (response.success) {
                if (onTournamentChanged) {
                    await onTournamentChanged();
                }
            } else {
                setSaveError(response);
            }
        } finally {
            setDeleting(false);
        }
    }

    function showTournamentSidesPlayers() {
        tournament.sides.sort(nameSort);

        return (<div>
            {tournament.sides.map(side => {
                side.players.sort(nameSort);

                return (<div key={side.id}>
                    <b>{side.name}</b>
                    {side.players.length > 0 ? ': ' : null}
                    {side.players.length > 0 ? (<label className="csv-nodes">{side.players.map(p => (<span key={p.id}>{p.name}</span>))}</label>) : null}
                </div>); })}
        </div>);
    }

    if (isProposedTournament && !isAdmin) {
        // don't show proposed tournament addresses when not an admin
        return null;
    }

    if (isProposedTournament) {
        return (<tr>
            <td colSpan="5">
                Tournament at <strong>{tournament.address}</strong>
            </td>
            <td className="medium-column-width">
                {isAdmin && isProposedTournament ? (<button className="btn btn-sm btn-primary text-nowrap" onClick={createTournamentGame}>
                        {creating ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🎖'}
                        Reserve
                    </button>)
                    : null}
            </td>
        </tr>)
    }

    return (<tr>
        <td colSpan={tournament.winningSide ? 3 : 5}>
            <Link to={`/tournament/${tournament.id}`}>
                {tournament.type} at <strong>{tournament.address}</strong>
            </Link>
            {expanded ? showTournamentSidesPlayers() : null}
        </td>
        {tournament.winningSide ? (<td colSpan="2">
            {tournament.winningSide
                ? (<span className="margin-left">Winner: <strong className="text-primary">{tournament.winningSide.name}</strong></span>)
                : null}
        </td>) : null}
        {isAdmin ? (<td className="medium-column-width">
            <button className="btn btn-sm btn-danger" onClick={deleteTournamentGame}>
                {deleting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🗑'}
            </button>
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save fixture details" />) : null}
        </td>) : null}
    </tr>);
}
