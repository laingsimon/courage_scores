import {ILayoutDataForSide} from "./ILayoutDataForSide";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";

export interface ILayoutDataForMatch {
    sideA: ILayoutDataForSide;
    sideB: ILayoutDataForSide;
    scoreA: string;
    scoreB: string;
    winner?: string;
    saygId?: string;
    mnemonic?: string;
    hideMnemonic?: boolean;
    matchOptions?: GameMatchOptionDto;
    match?: TournamentMatchDto;
    numberOfSidesOnTheNight?: string;
}