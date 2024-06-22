import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {any} from "../../helpers/collections";
import {ILayoutDataForRound} from "./layout";
import {IMnemonicGenerator} from "./layout/MnemonicGenerators";
import {PlayedEngine} from "./layout/PlayedEngine";
import {UnplayedEngine} from "./layout/UnplayedEngine";
import {ILayoutEngine} from "./layout/ILayoutEngine";

export interface ITournamentLayoutGenerationContext {
    matchOptionDefaults: GameMatchOptionDto;
    getLinkToSide(side: TournamentSideDto): JSX.Element;
    matchMnemonic?: IMnemonicGenerator;
}

export function getLayoutData(round: TournamentRoundDto, sides: TournamentSideDto[], context: ITournamentLayoutGenerationContext): ILayoutDataForRound[] {
    const unplayedEngine: ILayoutEngine = new UnplayedEngine();
    const engine: ILayoutEngine = round && any(round.matches)
        ? new PlayedEngine(unplayedEngine)
        : unplayedEngine;

    return engine.calculate({
        sides: sides.filter((s: TournamentSideDto) => !s.noShow),
        context,
        round,
    });
}
