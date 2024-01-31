import {repeat} from "./projection";
import {any} from "./collections";
import {IBootstrapDropdownItem} from "../components/common/BootstrapDropdown";

export interface ILayoutDataForSide {
    id: string;
    name: string;
    link: JSX.Element;
    mnemonic?: string;
}

export interface ILayoutDataForMatch {
    sideA: ILayoutDataForSide;
    sideB: ILayoutDataForSide;
    scoreA: string;
    scoreB: string;
    bye?: boolean;
    winner?: string;
    saygId?: string;
}

export interface ILayoutDataForRound {
    name: string;
    matches: ILayoutDataForMatch[];
}

export function getRoundNameFromSides(round: { name?: string | null }, sideLength: number, depth: number): string {
    if (round.name) {
        return round.name;
    }
    if (sideLength === 2) {
        return 'Final';
    }
    if (sideLength === 4) {
        return 'Semi-Final';
    }
    if (sideLength >= 6 && sideLength <= 8) {
        return 'Quarter-Final';
    }

    return `Round: ${depth}`;
}

export function hasScore(score?: number | null): boolean {
    return score !== null && score !== undefined;
}

/* istanbul ignore next */
export function sideSelection(side: { id: string, name: string}): IBootstrapDropdownItem {
    return {
        value: side.id,
        text: side.name
    };
}

export function getUnplayedLayoutData(noOfSides: number): ILayoutDataForRound[] {
    if (noOfSides <= 1) {
        return [];
    }

    const sideMnemonics: string[] = repeat(noOfSides, getMnemonicForIndex);
    return getUnplayedLayoutDataForSides(sideMnemonics, []);
}

export function getUnplayedLayoutDataForSides(mnemonics: string[], previousByes: string[]): ILayoutDataForRound[] {
    const mnemonicsToCreateMatchesFor: string[] = previousByes.concat(mnemonics.sort().filter((m: string) => !any(previousByes, (b: string) => b === m)));
    // any mnemonics with byes first then the remaining mnemonics in alphabetical order

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
        };

        if (match.sideB) {
            followOnMnemonics.push(mergeMnemonics(match.sideA.mnemonic, match.sideB.mnemonic));
        } else {
            byes.push(match.sideA.mnemonic);
        }

        matches.push(match);
    }

    const round: ILayoutDataForRound = {
        matches: matches,
        name: null,
    };

    if ((round.matches.length === 1 && byes.length === 0) || mnemonics.length <= 1) {
        return [round];
    }

    return [round].concat(getUnplayedLayoutDataForSides(followOnMnemonics.concat(byes), byes));
}

export function setRoundNames(layoutData: ILayoutDataForRound[]): ILayoutDataForRound[] {
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

function mergeMnemonics(current: string, additional: string): string {
    if (!current) {
        return additional;
    }

    return current.split('/').concat(additional.split('/')).sort().join('/');
}

function getMnemonicForIndex(ordinal: number): string {
    const mnemonics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
