import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {any} from "../../helpers/collections";
import {ILayoutDataForRound} from "./layout";
import {IMnemonicAccumulator} from "./layout/shared";
import {getPlayedLayoutData} from "./layout/played";
import {getUnplayedLayoutData} from "./layout/unplayed";

export interface ITournamentLayoutGenerationContext {
    matchOptionDefaults: GameMatchOptionDto;
    getLinkToSide(side: TournamentSideDto): JSX.Element;
    matchMnemonic?: IMnemonicAccumulator;
}

export function getLayoutData(round: TournamentRoundDto, sides: TournamentSideDto[], context: ITournamentLayoutGenerationContext): ILayoutDataForRound[] {
    return setRoundNames(round && any(round.matches)
        ? getPlayedLayoutData(sides, round, context)
        : getUnplayedLayoutData(sides.filter((s: TournamentSideDto) => !s.noShow)));
}

function setRoundNames(layoutData: ILayoutDataForRound[]): ILayoutDataForRound[] {
    const layoutDataCopy: ILayoutDataForRound[] = layoutData.filter(_ => true);
    const newLayoutData: ILayoutDataForRound[] = [];
    let unnamedRoundNumber: number = layoutDataCopy.length - 3;

    while (any(layoutDataCopy)) {
        const lastRound: ILayoutDataForRound = layoutDataCopy.pop();
        let roundName = null;
        switch (newLayoutData.length) {
            case 0:
                roundName = 'Final';
                break;
            case 1:
                roundName = 'Semi-Final';
                break;
            case 2:
                roundName = 'Quarter-Final';
                break;
            default:
                roundName = `Round ${unnamedRoundNumber--}`;
                break;
        }

        lastRound.name = lastRound.name || roundName;
        newLayoutData.unshift(lastRound);
    }

    return newLayoutData;
}

