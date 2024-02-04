import {repeat} from "./projection";
import {any} from "./collections";
import {IBootstrapDropdownItem} from "../components/common/BootstrapDropdown";
import {TournamentSideDto} from "../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentGameDto} from "../interfaces/models/dtos/Game/TournamentGameDto";
import {TournamentRoundDto} from "../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../interfaces/models/dtos/Game/TournamentMatchDto";
import {GameMatchOptionDto} from "../interfaces/models/dtos/Game/GameMatchOptionDto";

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
    mnemonic?: string;
    hideMnemonic?: boolean;
}

export interface ILayoutDataForRound {
    name: string;
    matches: ILayoutDataForMatch[];
    possibleSides: TournamentSideDto[];
    alreadySelectedSides: TournamentSideDto[];
}

export interface IMnemonicAccumulator {
    next: () => string;
}

export interface ITournamentLayoutGenerationContext {
    matchOptionDefaults: GameMatchOptionDto;
    getLinkToSide: (side: TournamentSideDto) => JSX.Element;
    matchMnemonic?: IMnemonicAccumulator;
}

interface IRoundLayoutGenerationContext {
    matchOptionDefaults: GameMatchOptionDto;
    matchMnemonic: IMnemonicAccumulator;
    getLinkToSide: (side: TournamentSideDto) => JSX.Element;
    sideMnemonicCalculator: IMnemonicAccumulator;
    winnersFromThisRound: TournamentSideDto[];
    sides: TournamentSideDto[];
}

interface IMatchLayoutGenerationContext {
    round: TournamentRoundDto;
    roundContext: IRoundLayoutGenerationContext;
    playedInThisRound: TournamentSideDto[];
}

export function getPrefixIncrementingMnemonicCalculator(prefix: string): IMnemonicAccumulator {
    let index: number = 0;
    return {
        next(): string {
            return prefix + (++index);
        }
    };
}

export function getAlphaMnemonicCalculator(): IMnemonicAccumulator {
    let ordinal: number = 0;
    const mnemonics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return {
        next(): string {
            return mnemonics[ordinal++];
        }
    };
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

export function getUnplayedLayoutData(sides: TournamentSideDto[]): ILayoutDataForRound[] {
    if (sides.length <= 1) {
        return [];
    }

    const sideMnemonics: string[] = repeat(sides.length, getMnemonicForIndex);
    return getUnplayedLayoutDataForSides(sideMnemonics, [], sides);
}

export function getUnplayedLayoutDataForSides(mnemonics: string[], previousByes: string[], sides: TournamentSideDto[], matchMnemonic?: IMnemonicAccumulator, singleRound?: boolean): ILayoutDataForRound[] {
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

function getMatchLayoutData(match: TournamentMatchDto, index: number, context: IMatchLayoutGenerationContext): ILayoutDataForMatch {
    let winner = null;
    context.playedInThisRound.push(match.sideA);
    context.playedInThisRound.push(match.sideB);
    const matchOptions: GameMatchOptionDto = context.round.matchOptions[index] || context.roundContext.matchOptionDefaults;
    const numberOfLegs: number = matchOptions.numberOfLegs;

    if (match.scoreA > (numberOfLegs / 2.0)) {
        context.roundContext.winnersFromThisRound.push(match.sideA);
        winner = 'sideA';
    } else if (match.scoreB > (numberOfLegs / 2.0)) {
        context.roundContext.winnersFromThisRound.push(match.sideB);
        winner = 'sideB';
    }

    return {
        sideA: {id: match.sideA.id, name: match.sideA.name, link: context.roundContext.getLinkToSide(match.sideA), mnemonic: match.sideA.id ? null : context.roundContext.sideMnemonicCalculator.next()},
        sideB: {id: match.sideB.id, name: match.sideB.name, link: context.roundContext.getLinkToSide(match.sideB), mnemonic: match.sideB.id ? null : context.roundContext.sideMnemonicCalculator.next()},
        scoreA: (match.scoreA ? match.scoreA.toString() : null) || '0',
        scoreB: (match.scoreB ? match.scoreB.toString() : null) || '0',
        bye: false,
        winner: winner,
        saygId: match.saygId,
        mnemonic: context.roundContext.matchMnemonic.next(),
        hideMnemonic: allSidesSelectedInNextRound(context.round, match) || context.roundContext.sides.length === 2,
    };
}

function allSidesSelectedInNextRound(round: TournamentRoundDto, match: TournamentMatchDto): boolean {
    const nextRound: TournamentRoundDto = round.nextRound;
    if (!nextRound) {
        return false;
    }

    const sideIdsToFind: string[] = [ match.sideA, match.sideB ].map((s: TournamentSideDto) => s ? s.id : null).filter((id: string) => !!id);
    return any(nextRound.matches, (m: TournamentMatchDto) => any(sideIdsToFind, (id: string) => (m.sideA && m.sideA.id === id) || (m.sideB && m.sideB.id === id)));
}

function getRoundLayoutData(round: TournamentRoundDto, roundContext: IRoundLayoutGenerationContext): ILayoutDataForRound {
    const matchContext: IMatchLayoutGenerationContext = {
        roundContext,
        round,
        playedInThisRound: [],
    };

    return {
        name: round.name,
        matches: round.matches.map((match: TournamentMatchDto, index: number): ILayoutDataForMatch => {
            return getMatchLayoutData(match, index, matchContext);
        }),
        possibleSides: roundContext.sides,
        alreadySelectedSides: matchContext.playedInThisRound,
    };
}

export function getPlayedLayoutData(sides: TournamentSideDto[], round: TournamentRoundDto, context: ITournamentLayoutGenerationContext): ILayoutDataForRound[] {
    if (!round) {
        return [];
    }

    const sideMnemonicCalculator: IMnemonicAccumulator = getAlphaMnemonicCalculator();
    const layoutContext: IRoundLayoutGenerationContext = {
        getLinkToSide: context.getLinkToSide,
        matchOptionDefaults: context.matchOptionDefaults,
        matchMnemonic: context.matchMnemonic || getPrefixIncrementingMnemonicCalculator('M'),
        sideMnemonicCalculator,
        winnersFromThisRound: [],
        sides,
    }

    const layoutDataForRound: ILayoutDataForRound = getRoundLayoutData(round, layoutContext);
    const winnersFromThisRound: TournamentSideDto[] = layoutContext.winnersFromThisRound;

    const sidesThatHaveNotPlayedInThisRound: TournamentSideDto[] = layoutContext.sides
        .filter((side: TournamentSideDto) => !side.noShow)
        .filter((side: TournamentSideDto) => !any(layoutDataForRound.alreadySelectedSides, (s: TournamentSideDto) => s.id === side.id))
    const winnersAndByes: TournamentSideDto[] = sidesThatHaveNotPlayedInThisRound.concat(winnersFromThisRound);

    if (any(sidesThatHaveNotPlayedInThisRound)) {
        const totalOfUnbalancedMatches: number = layoutDataForRound.matches.filter((m: ILayoutDataForMatch) => (m.sideA.id && !m.sideB.id) || (m.sideB.id && !m.sideA.id)).length;
        if (totalOfUnbalancedMatches < sidesThatHaveNotPlayedInThisRound.length) {
            const byes: number = sidesThatHaveNotPlayedInThisRound.length - totalOfUnbalancedMatches;
            const mnemonics: string[] = byes <= 2
                ? sidesThatHaveNotPlayedInThisRound.map((s: TournamentSideDto) => s.name)
                : repeat(byes, (_: number) => sideMnemonicCalculator.next());
            const byeLayout: ILayoutDataForRound = getUnplayedLayoutDataForSides(mnemonics, mnemonics, winnersAndByes, layoutContext.matchMnemonic, true)[0];
            layoutDataForRound.matches = layoutDataForRound.matches.concat(byeLayout.matches);
        }
    }

    if ((!round.nextRound || !any(round.nextRound.matches)) && layoutContext.sides.length > 2) {
        // partially played tournament... project the remaining rounds as unplayed...
        const mnemonics: string[] = layoutDataForRound.matches.map((m: ILayoutDataForMatch): string => {
            if (m.sideB) {
                return m.winner ? m[m.winner].name : `winner(${m.mnemonic})`;
            }

            return m.sideA.name || m.sideA.mnemonic;
        });

        const byes: string[] = layoutDataForRound.matches.flatMap((m: ILayoutDataForMatch): string[] => {
            if (m.sideB) {
                return [];
            }

            return [ m.sideA.name || m.sideA.mnemonic ];
        });
        return [layoutDataForRound].concat(getUnplayedLayoutDataForSides(mnemonics, byes, winnersAndByes, context.matchMnemonic));
    }

    return [layoutDataForRound].concat(getPlayedLayoutData(winnersAndByes, round.nextRound, context));
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

export function sideChanged(tournamentData: TournamentGameDto, newSide: TournamentSideDto, sideIndex: number): TournamentGameDto {
    const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
    newSide.name = (newSide.name || '').trim();
    newTournamentData.sides[sideIndex] = newSide;
    updateSideDataInRound(newTournamentData.round, newSide);
    return newTournamentData;
}

function updateSideDataInRound(round: TournamentRoundDto, side: TournamentSideDto) {
    if (!round) {
        return;
    }

    if (round.matches) {
        for (let index = 0; index < round.matches.length; index++) {
            const match: TournamentMatchDto = round.matches[index];
            if (match.sideA && match.sideA.id === side.id) {
                match.sideA = side;
            } else if (match.sideB && match.sideB.id === side.id) {
                match.sideB = side;
            }
        }
    }

    updateSideDataInRound(round.nextRound, side);
}

export function removeSide(tournamentData: TournamentGameDto, side: TournamentSideDto): TournamentGameDto {
    const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
    newTournamentData.sides = tournamentData.sides.filter((s: TournamentSideDto) => s.id !== side.id);
    return newTournamentData;
}

export function addSide(tournamentData: TournamentGameDto, newSide: TournamentSideDto): TournamentGameDto {
    const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
    newSide.name = (newSide.name || '').trim();
    newTournamentData.sides.push(newSide);
    return newTournamentData;
}
