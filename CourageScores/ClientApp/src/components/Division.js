import React from 'react';
import { useParams } from "react-router-dom";

export function Division(props) {
    const { divisionId } = useParams();
    const division = props.divisions[divisionId];

    if (!division) {
        return (<div>Loading...</div>);
    }

    return (<div>
            <h2>{division.name}</h2>
        </div>);
}
