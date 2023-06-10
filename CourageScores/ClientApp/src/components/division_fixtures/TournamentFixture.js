import React, {useState} from 'react';
import {Link} from "react-router-dom";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {any, sortBy} from "../../helpers/collections";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useDivisionData} from "../DivisionDataContainer";

export function TournamentFixture({ tournament, onTournamentChanged, date, expanded }) {
    const { id: divisionId, season } = useDivisionData();
    const { account } = useApp();
    const [ creating, setCreating ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const isAdmin = account && account.access && account.access.manageTournaments;
    const { tournamentApi } = useDependencies();

    async function createTournamentGame() {
        /* istanbul ignore next */
        if (creating || deleting) {
            /* istanbul ignore next */
            return;
        }

        try {
            setCreating(true);

            const response = await tournamentApi.create({
                date: date,
                address: tournament.address,
                divisionId: divisionId,
                seasonId: season.id
            }, tournament.updated);

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
        /* istanbul ignore next */
        if (deleting || creating) {
            /* istanbul ignore next */
            return;
        }

        if (!window.confirm(`Are you sure you want to delete this tournament fixture?`)) {
            return;
        }

        try {
            setDeleting(true);

            const response = await tournamentApi.delete(tournament.id);

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

    function renderLinkToPlayer(player) {
        return (<Link key={player.id} to={`/division/${divisionId}/player:${player.id}/${season.id}`}>{player.name}</Link>);
    }

    function showTournamentSidesPlayers() {
        tournament.sides.sort(sortBy('name'));

        return (<div className="px-3">
            {tournament.sides.map(side => {
                if (side.teamId && side.players.length !== 1) {
                    return (<div key={side.id}>
                        <Link to={`/division/${divisionId}/team:${side.teamId}/${season.id}`}>{side.name}</Link>
                    </div>);
                }

                return (<div key={side.id}>
                    {any(side.players)
                        ? (<label className="csv-nodes">{side.players.sort(sortBy('name')).map(renderLinkToPlayer)}</label>)
                        : null}
                </div>);
            })}
        </div>);
    }

    function renderWinner(winningSide) {
        if (winningSide.teamId) {
            return (<strong className="text-primary">
                <Link to={`/division/${divisionId}/team:${winningSide.teamId}/${season.id}`}>{winningSide.name}</Link>
            </strong>);
        }

        return (<strong className="text-primary">{winningSide.name}</strong>);
    }

    if (tournament.proposed) {
        if (!isAdmin) {
            // don't show proposed tournament addresses when not an admin
            return null;
        }

        return (<tr>
            <td colSpan="5">
                Tournament at <strong>{tournament.address}</strong>
            </td>
            <td className="medium-column-width text-end">
                {isAdmin && tournament.proposed ? (<button className="btn btn-sm btn-primary text-nowrap" onClick={createTournamentGame}>
                        {creating ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '➕'}
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
                ? (<span className="margin-left">Winner: {renderWinner(tournament.winningSide)}</span>)
                : null}
        </td>) : null}
        {isAdmin ? (<td className="medium-column-width text-end">
            <button className="btn btn-sm btn-danger" onClick={deleteTournamentGame}>
                {deleting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🗑'}
            </button>
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save fixture details" />) : null}
        </td>) : null}
    </tr>);
}
