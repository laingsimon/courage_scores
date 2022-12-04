import React from 'react';
import {Link} from "react-router-dom";

export function KnockoutFixture({ fixture }) {
    return (<tr>
        <td colSpan="5">
            Knockout fixture: {fixture.id}
        </td>
        <td>
            <Link className="btn btn-sm btn-primary margin-right" to={`/knockout/${fixture.id}`}>🎖️</Link> : null
        </td>
    </tr>)
}