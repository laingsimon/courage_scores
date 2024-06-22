import {ILayoutDataForRound} from "../layout";
import {ILayoutRequest} from "./ILayoutRequest";

export interface ILayoutEngine {
    calculate(request: ILayoutRequest): ILayoutDataForRound[]
}