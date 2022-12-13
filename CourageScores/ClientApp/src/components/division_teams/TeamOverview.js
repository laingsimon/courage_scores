import React from 'react';
import {Link} from "react-router-dom";

export function TeamOverview({ divisionData, teamId }) {
    /* division name, team name, address/venue */
    /* games played and to play in scores and venues */
    /* position in table */
    /* players and link to their details */

    return (<div className="light-background p-3">
        Team overview: {teamId}

        <div className="pt-3">
        <Link to={`/division/${divisionData.id}/teams`} className="btn btn-primary">Back to teams</Link>
        </div>
    </div>)
}