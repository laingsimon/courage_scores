import {IManOfTheMatchDto} from './IManOfTheMatchDto'
import {IRecordScoresGameMatchDto} from './IRecordScoresGameMatchDto'
import {IRecordScoresGamePlayerDto} from './IRecordScoresGamePlayerDto'
import {IGameOver100CheckoutDto} from './IGameOver100CheckoutDto'
import {IGameMatchOptionDto} from './IGameMatchOptionDto'

// see CourageScores.Models.Dtos.Game.RecordScoresDto
export interface IRecordScoresDto {
    home?: IManOfTheMatchDto;
    away?: IManOfTheMatchDto;
    matches?: IRecordScoresGameMatchDto[];
    oneEighties?: IRecordScoresGamePlayerDto[];
    over100Checkouts?: IGameOver100CheckoutDto[];
    matchOptions?: IGameMatchOptionDto[];
    address: string;
    postponed?: boolean;
    isKnockout?: boolean;
    accoladesCount?: boolean;
    date?: string;
    lastUpdated?: string;
}
