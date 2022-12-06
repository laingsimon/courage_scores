import React, {useState} from 'react';
import {Link} from "react-router-dom";
import {KnockoutApi} from "../../api/knockout";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ErrorDisplay} from "../common/ErrorDisplay";

export function KnockoutFixture({ account, knockout, onKnockoutChanged, seasonId, divisionId, date }) {
    const isProposedKnockout = !knockout.round && knockout.id === '00000000-0000-0000-0000-000000000000';
    const [ creating, setCreating ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const isAdmin = account && account.access && account.access.manageGames;

    async function createKnockoutGame() {
        if (creating || deleting) {
            return;
        }

        try {
            setCreating(true);

            const api = new KnockoutApi(new Http(new Settings()));
            const response = await api.update({
                date: date,
                address: knockout.address,
                divisionId: divisionId,
                seasonId: seasonId
            });

            if (response.success) {
                if (onKnockoutChanged) {
                    await onKnockoutChanged();
                }
            } else {
                setSaveError(response);
            }
        } finally {
            setCreating(false);
        }
    }

    async function deleteKnockout() {
        if (deleting || creating) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete this knockout fixture?`)) {
            return;
        }

        try {
            setDeleting(true);

            const api = new KnockoutApi(new Http(new Settings()));
            const response = await api.delete(knockout.id);

            if (response.success) {
                if (onKnockoutChanged) {
                    await onKnockoutChanged();
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

    function getKnockoutType(sides) {
        if (!sides || !sides.length) {
            return 'Knockout';
        }

        const firstSide = sides[0];
        const playerCount = firstSide.players.length;

        switch (playerCount) {
            case 1: return 'Singles';
            case 2: return 'Pairs';
            default: return 'Knockout';
        }
    }

    if (isProposedKnockout && !isAdmin) {
        // don't show proposed knockout addresses when not an admin
        return null;
    }

    if (isProposedKnockout) {
        return (<tr>
            <td colSpan="4">
                Knockout at <strong>{knockout.address}</strong>
            </td>
            <td colSpan="2" className="text-end">
                {isAdmin && isProposedKnockout ? (<button className="btn btn-sm btn-primary" onClick={createKnockoutGame}>
                        {creating ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🎖'}
                        Reserve for knockout
                    </button>)
                    : null}
            </td>
        </tr>)
    }

    return (<tr>
        <td colSpan="2">
            {getKnockoutType(knockout.sides)} at <strong>{knockout.address}</strong>
        </td>
        <td colSpan="3">
            {knockout.round ? (renderResult(knockout.round, 1)) : null}
        </td>
        <td className="medium-column-width">
            <Link className="btn btn-sm btn-primary margin-right" to={`/knockout/${knockout.id}`}>🎖️</Link>
            {isAdmin ? (<button className="btn btn-sm btn-danger" onClick={deleteKnockout}>) : null}
                {deleting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '🗑'}
            </button>) : null}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save fixture details" />) : null}
        </td>
    </tr>);
}
