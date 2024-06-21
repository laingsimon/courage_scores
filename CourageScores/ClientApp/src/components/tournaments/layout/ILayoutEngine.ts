import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {ILayoutDataForRound} from "../layout";

export interface ILayoutEngine {
    calculate(sides: TournamentSideDto[]): ILayoutDataForRound[]
}