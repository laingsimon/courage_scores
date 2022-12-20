import React, {useState} from 'react';
import {Link} from "react-router-dom";
import {TournamentApi} from "../../api/tournament";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ErrorDisplay} from "../common/ErrorDisplay";

export function TournamentFixture({ account, tournament, onTournamentChanged, seasonId, divisionId, date }) {
    const isProposedTournament = !tournament.round && tournament.id === '00000000-0000-0000-0000-000000000000';
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

    function renderResult(round, rounds) {
        if (!round) {
            return null;
        }

        if (round.nextRound) {
            return renderResult(round.nextRound, rounds + 1);
        }

        if (round && round.matches && round.matches.length === 1) {
            const match = round.matches[0];
            if (match.scoreA && match.scoreB && match.sideA && match.sideB) {
                if (Number.parseInt(match.scoreA) > Number.parseInt(match.scoreB)) {
                    return renderWiningSide(match.sideA, rounds);
                } else if (Number.parseInt(match.scoreB) > Number.parseInt(match.scoreA)) {
                    return renderWiningSide(match.sideB, rounds);
                } else {
                    return (<span>A draw after {rounds} rounds</span>);
                }
            }

            return null;
        }
    }

    function renderWiningSide(side, rounds) {
        return (<span className="margin-left">Winner: <strong className="text-primary">{side.name || side.id}</strong> after {rounds} rounds</span>);
    }

    function getTournamentType(sides) {
        if (!sides || !sides.length) {
            return 'Tournament';
        }

        const firstSide = sides[0];
        const playerCount = firstSide.players.length;

        switch (playerCount) {
            case 1: return 'Singles';
            case 2: return 'Pairs';
            default: return 'Tournament';
        }
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
        <td colSpan={tournament.round ? 3 : 5}>
            <Link to={`/tournament/${tournament.id}`}>
                {getTournamentType(tournament.sides)} at <strong>{tournament.address}</strong>
            </Link>
        </td>
        {tournament.round ? (<td colSpan="2">
            {renderResult(tournament.round, 1)}
        </td>) : null}
        {isAdmin ? (<td className="medium-column-width">
            <button className="btn btn-sm btn-danger" onClick={deleteTournamentGame}>
                {deleting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🗑'}
            </button>
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save fixture details" />) : null}
        </td>) : null}
    </tr>);
}
