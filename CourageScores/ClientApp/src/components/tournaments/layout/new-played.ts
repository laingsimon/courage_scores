import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";
import {ITournamentLayoutGenerationContext} from "../competition";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {getUnplayedLayoutData} from "./new-unplayed";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {any} from "../../../helpers/collections";

export function getPlayedLayoutData(sides: TournamentSideDto[], round: TournamentRoundDto, context: ITournamentLayoutGenerationContext): ILayoutDataForRound[] {
    const unplayedRounds: ILayoutDataForRound[] = getUnplayedLayoutData(sides);
    const rounds: TournamentRoundDto[] = flattenAllRounds(round);
    let remainingSides: TournamentSideDto[] = sides.filter(s => !!s);

    return unplayedRounds.map((unplayedRound: ILayoutDataForRound, index: number): ILayoutDataForRound => {
        const playedRound: TournamentRoundDto = rounds[index];
        if (!playedRound) {
            const adaptedRound: ILayoutDataForRound = Object.assign({}, unplayedRound);
            adaptedRound.possibleSides = remainingSides.filter(s => !!s); // copy the array so it cannot be modified
            return adaptedRound;
        }

        const winners: TournamentSideDto[] = [];
        const round: ILayoutDataForRound = createRound(context, playedRound, unplayedRound, winners, remainingSides);
        const unselectedSides: TournamentSideDto[] = remainingSides.filter((remainingSide: TournamentSideDto) => {
            return !any(round.alreadySelectedSides, (s: TournamentSideDto) => s.id === remainingSide.id); // exclude any already selected side
        });
        remainingSides = winners.concat(unselectedSides);
        return round;
    });
}

function flattenAllRounds(round: TournamentRoundDto): TournamentRoundDto[] {
    let currentRound: TournamentRoundDto = round;
    const rounds: TournamentRoundDto[] = [];

    while (currentRound) {
        rounds.push(currentRound);
        currentRound = currentRound.nextRound;
    }

    return rounds;
}

function createRound(context: ITournamentLayoutGenerationContext, playedRound: TournamentRoundDto, unplayedRound: ILayoutDataForRound,
                     winners: TournamentSideDto[], remainingSides: TournamentSideDto[]): ILayoutDataForRound {
    const alreadySelectedSides: TournamentSideDto[] = []; // sides will be added in as matches are created

    return {
        name: unplayedRound.name,
        round: playedRound,
        preRound: unplayedRound.preRound,
        possibleSides: remainingSides,
        alreadySelectedSides: alreadySelectedSides,
        matches: unplayedRound.matches.map((unplayedMatch: ILayoutDataForMatch, index: number): ILayoutDataForMatch => {
            const playedMatch: TournamentMatchDto = playedRound ? playedRound.matches[index] : null;
            if (!playedMatch) {
                // add to unplayed sides
                return unplayedMatch;
            }

            return createMatch(context, playedRound, unplayedMatch, playedMatch, index, alreadySelectedSides, winners);
        }),
    };
}

function createMatch(context: ITournamentLayoutGenerationContext, playedRound: TournamentRoundDto, unplayedMatch: ILayoutDataForMatch,
                     playedMatch: TournamentMatchDto, index: number, alreadySelectedSides: TournamentSideDto[], winners: TournamentSideDto[]): ILayoutDataForMatch {
    let winner: string = null;
    const matchOptions: GameMatchOptionDto = playedRound.matchOptions[index] || context.matchOptionDefaults;
    const numberOfLegs: number = matchOptions.numberOfLegs;
    if (playedMatch.scoreA > (numberOfLegs / 2.0)) {
        winners.push(playedMatch.sideA);
        winner = 'sideA';
    } else if (playedMatch.scoreB > (numberOfLegs / 2.0)) {
        winners.push(playedMatch.sideB);
        winner = 'sideB';
    }
    alreadySelectedSides.push(playedMatch.sideA);
    alreadySelectedSides.push(playedMatch.sideB);

    return {
        sideA: getSide(context, playedMatch.sideA, unplayedMatch.sideA.mnemonic),
        sideB: getSide(context, playedMatch.sideB, unplayedMatch.sideB.mnemonic),
        scoreA: (playedMatch.scoreA ? playedMatch.scoreA.toString() : null) || '0',
        scoreB: (playedMatch.scoreB ? playedMatch.scoreB.toString() : null) || '0',
        match: playedMatch,
        bye: unplayedMatch.bye,
        winner: winner,
        mnemonic: unplayedMatch.mnemonic,
        hideMnemonic: unplayedMatch.hideMnemonic,
        numberOfSidesOnTheNight: unplayedMatch.numberOfSidesOnTheNight,
        matchOptions: unplayedMatch.matchOptions,
        saygId: playedMatch.saygId,
    };
}

function getSide(context: ITournamentLayoutGenerationContext, side?: TournamentSideDto, mnemonic?: string): ILayoutDataForSide {
    return {
        id: side ? side.id : null,
        name: side ? side.name: null,
        link: side ? context.getLinkToSide(side) : null,
        mnemonic: side && side.id
            ? null
            : mnemonic
    };
}
