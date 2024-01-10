import React from "react";
import {useSayg} from "../sayg/SaygLoadingContainer";

export function SuperleagueMatchHeading({ match }) {
    const { sayg } = useSayg();
    const home = match.sideA.name;
    const away = match.sideB.name;

    return ( <h5 className="modal-header justify-content-center">
        {home} vs {away} - best of {sayg.numberOfLegs}
    </h5>);
}