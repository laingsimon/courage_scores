import { ILayoutDataForMatch } from './ILayoutDataForMatch.ts';
import { TournamentSideDto } from '../../../interfaces/models/dtos/Game/TournamentSideDto.ts';
import { TournamentRoundDto } from '../../../interfaces/models/dtos/Game/TournamentRoundDto.ts';

export interface ILayoutDataForRound {
    name: string;
    matches: ILayoutDataForMatch[];
    possibleSides: TournamentSideDto[];
    alreadySelectedSides: TournamentSideDto[];
    round?: TournamentRoundDto;
    preRound?: boolean;
}
