import { ILayoutDataForSide } from './ILayoutDataForSide.ts';
import { GameMatchOptionDto } from '../../../interfaces/models/dtos/Game/GameMatchOptionDto.ts';
import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto.ts';

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
