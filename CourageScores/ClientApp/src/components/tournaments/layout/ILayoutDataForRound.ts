import {ILayoutDataForMatch} from "./ILayoutDataForMatch";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";

export interface ILayoutDataForRound {
    name: string;
    matches: ILayoutDataForMatch[];
    possibleSides: TournamentSideDto[];
    alreadySelectedSides: TournamentSideDto[];
    round?: TournamentRoundDto;
    preRound?: boolean;
}


