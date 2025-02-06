import {useSayg} from "../sayg/SaygLoadingContainer";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";

export interface ISuperleagueMatchHeadingProps {
    match: TournamentMatchDto;
}

export function SuperleagueMatchHeading({ match }: ISuperleagueMatchHeadingProps) {
    const { sayg } = useSayg();
    const home: string | undefined = match.sideA.name;
    const away: string | undefined = match.sideB.name;

    return ( <h5 className="modal-header justify-content-center">
        {home} vs {away} - best of {sayg.numberOfLegs}
    </h5>);
}