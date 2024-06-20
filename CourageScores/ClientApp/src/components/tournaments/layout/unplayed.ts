import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {repeat} from "../../../helpers/projection";
import {any} from "../../../helpers/collections";
import {getPrefixIncrementingMnemonicCalculator, IMnemonicAccumulator} from "./shared";

export function getUnplayedLayoutData(sides: TournamentSideDto[]): ILayoutDataForRound[] {
    if (sides.length <= 1) {
        return [];
    }

    const sideMnemonics: string[] = repeat(sides.length, getMnemonicForIndex);
    return getUnplayedLayoutDataForSides(sideMnemonics, [], sides);
}

function getUnplayedLayoutDataForSides(mnemonics: string[], previousByes: string[], sides: TournamentSideDto[], matchMnemonic?: IMnemonicAccumulator, singleRound?: boolean): ILayoutDataForRound[] {
    const mnemonicsToCreateMatchesFor: string[] = previousByes.concat(mnemonics.sort().filter((m: string) => !any(previousByes, (b: string) => b === m)));
    // any mnemonics with byes first then the remaining mnemonics in alphabetical order
    matchMnemonic = matchMnemonic || getPrefixIncrementingMnemonicCalculator('M');

    const matches: ILayoutDataForMatch[] = [];
    const byes: string[] = [];
    const followOnMnemonics: string[] = [];

    while (mnemonicsToCreateMatchesFor.length > 0) {
        const sideA: string = mnemonicsToCreateMatchesFor.shift();
        const bye: boolean = mnemonicsToCreateMatchesFor.length === 0;

        const match: ILayoutDataForMatch = {
            sideA: getLayoutSide(null, null, null, sideA),
            sideB: bye ? null : getLayoutSide(null, null, null, mnemonicsToCreateMatchesFor.shift()),
            bye,
            scoreA: null,
            scoreB: null,
            mnemonic: bye ? null : matchMnemonic.next(),
        };

        if (match.sideB) {
            followOnMnemonics.push(`winner(${match.mnemonic})`);
        } else {
            byes.push(match.sideA.mnemonic);
        }

        matches.push(match);
    }

    const round: ILayoutDataForRound = {
        matches: matches,
        name: null,
        possibleSides: sides,
        alreadySelectedSides: [],
    };

    if ((round.matches.length === 1 && byes.length === 0) || mnemonics.length <= 1 || singleRound) {
        return [round];
    }

    return [round].concat(getUnplayedLayoutDataForSides(followOnMnemonics.concat(byes), byes, sides, matchMnemonic));
}

function getMnemonicForIndex(ordinal: number): string {
    const mnemonics: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return mnemonics[ordinal];
}

function getLayoutSide(id?: string, name?: string, link?: JSX.Element, mnemonic?: string): ILayoutDataForSide {
    return {
        id: id || null,
        name: name || null,
        link: link || null,
        mnemonic: mnemonic || null,
    };
}

