import {ILayoutRequest} from "./ILayoutRequest";
import {ILayoutDataForRound} from "./ILayoutDataForRound";

export interface ILayoutEngine {
    calculate(request: ILayoutRequest): ILayoutDataForRound[]
}