import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {any} from "../../../helpers/collections";
import {repeat} from "../../../helpers/projection";
import {ITournamentLayoutGenerationContext} from "../competition";
import {getPrefixIncrementingMnemonicCalculator, IMnemonicAccumulator} from "./shared";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";

interface IMatchLayoutGenerationContext {
    round: TournamentRoundDto;
    roundContext: IRoundLayoutGenerationContext;
    playedInThisRound: TournamentSideDto[];
}

interface IRoundLayoutGenerationContext {
    matchOptionDefaults: GameMatchOptionDto;
    matchMnemonic: IMnemonicAccumulator;
    getLinkToSide(side: TournamentSideDto): JSX.Element;
    sideMnemonicCalculator: IMnemonicAccumulator;
    winnersFromThisRound: TournamentSideDto[];
    sides: TournamentSideDto[];
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
        return [layoutDataForRound].concat(getUnplayedLayoutDataForSides(mnemonics, byes, winnersAndByes, layoutContext.matchMnemonic));
    }

    return [layoutDataForRound].concat(getPlayedLayoutData(winnersAndByes, round.nextRound, context));
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
        round,
    };
}

function getMatchLayoutData(match: TournamentMatchDto, index: number, context: IMatchLayoutGenerationContext): ILayoutDataForMatch {
    let winner: string = null;
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

    function getSide(side?: TournamentSideDto): ILayoutDataForSide {
        return {
            id: side ? side.id : null,
            name: side ? side.name: null,
            link: side ? context.roundContext.getLinkToSide(side) : null,
            mnemonic: side && side.id
                ? null
                : context.roundContext.sideMnemonicCalculator.next()
        };
    }

    return {
        sideA: getSide(match.sideA),
        sideB: getSide(match.sideB),
        scoreA: (match.scoreA ? match.scoreA.toString() : null) || '0',
        scoreB: (match.scoreB ? match.scoreB.toString() : null) || '0',
        bye: false,
        winner: winner,
        saygId: match.saygId,
        mnemonic: context.roundContext.matchMnemonic.next(),
        hideMnemonic: allSidesSelectedInSubsequentRound(context.round, match) || context.roundContext.sides.length === 2,
        matchOptions: matchOptions,
        match,
    };
}

function allSidesSelectedInSubsequentRound(round: TournamentRoundDto, match: TournamentMatchDto): boolean {
    const sideIdsToFind: string[] = [ match.sideA, match.sideB ].map((s: TournamentSideDto) => s ? s.id : null).filter((id: string) => !!id);
    return sidesExistInThisOrSubsequentRound(round.nextRound, sideIdsToFind);
}

function sidesExistInThisOrSubsequentRound(round: TournamentRoundDto, sideIdsToFind: string[]): boolean {
    if (!round) {
        return false;
    }

    const found: boolean = any(round.matches, (m: TournamentMatchDto) => any(sideIdsToFind, (id: string) => (m.sideA && m.sideA.id === id) || (m.sideB && m.sideB.id === id)));
    if (found) {
        return true;
    }

    return sidesExistInThisOrSubsequentRound(round.nextRound, sideIdsToFind);
}

function getAlphaMnemonicCalculator(): IMnemonicAccumulator {
    let ordinal: number = 0;
    const mnemonics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return {
        next(): string {
            return mnemonics[ordinal++];
        }
    };
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

function getLayoutSide(id?: string, name?: string, link?: JSX.Element, mnemonic?: string): ILayoutDataForSide {
    return {
        id: id || null,
        name: name || null,
        link: link || null,
        mnemonic: mnemonic || null,
    };
}

