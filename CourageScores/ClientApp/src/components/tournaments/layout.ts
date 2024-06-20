import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";

export interface ILayoutDataForSide {
    id: string;
    name: string;
    link: JSX.Element;
    mnemonic?: string;
}

export interface ILayoutDataForMatch {
    sideA: ILayoutDataForSide;
    sideB: ILayoutDataForSide;
    scoreA: string;
    scoreB: string;
    bye?: boolean;
    winner?: string;
    saygId?: string;
    mnemonic?: string;
    hideMnemonic?: boolean;
    matchOptions?: GameMatchOptionDto;
    match?: TournamentMatchDto;
    numberOfSidesOnTheNight?: number;
}

export interface ILayoutDataForRound {
    name: string;
    matches: ILayoutDataForMatch[];
    possibleSides: TournamentSideDto[];
    alreadySelectedSides: TournamentSideDto[];
    round?: TournamentRoundDto;
}


