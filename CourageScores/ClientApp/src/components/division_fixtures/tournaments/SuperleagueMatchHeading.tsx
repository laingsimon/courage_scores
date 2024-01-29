import React from "react";
import {useSayg} from "../sayg/SaygLoadingContainer";
import {ITournamentMatchDto} from "../../../interfaces/dtos/Game/ITournamentMatchDto";

export interface ISuperleagueMatchHeadingProps {
    match: ITournamentMatchDto;
}

export function SuperleagueMatchHeading({ match }: ISuperleagueMatchHeadingProps) {
    const { sayg } = useSayg();
    const home: string = match.sideA.name;
    const away: string = match.sideB.name;

    return ( <h5 className="modal-header justify-content-center">
        {home} vs {away} - best of {sayg.numberOfLegs}
    </h5>);
}