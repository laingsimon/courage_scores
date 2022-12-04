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
        <td colSpan="5">
            Knockout at <strong>{knockout.address}</strong>
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
