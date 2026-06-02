import { ILayoutRequest } from './ILayoutRequest.ts';
import { ILayoutDataForRound } from './ILayoutDataForRound.ts';

export interface ILayoutEngine {
    calculate(request: ILayoutRequest): ILayoutDataForRound[];
}
