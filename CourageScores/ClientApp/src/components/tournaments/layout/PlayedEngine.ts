import {ILayoutEngine} from "./ILayoutEngine";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";
import {any, skip} from "../../../helpers/collections";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {ILayoutRequest} from "./ILayoutRequest";
import {ITournamentLayoutGenerationContext} from "../competition";
import {ILayoutDataForRound} from "./ILayoutDataForRound";
import {ILayoutDataForMatch} from "./ILayoutDataForMatch";
import {ILayoutDataForSide} from "./ILayoutDataForSide";

export class PlayedEngine implements ILayoutEngine {
    private readonly _unplayedEngine: ILayoutEngine;

    constructor(unplayedEngine: ILayoutEngine) {
        this._unplayedEngine = unplayedEngine;
    }

    calculate(request: ILayoutRequest): ILayoutDataForRound[] {
        const unplayedRounds: ILayoutDataForRound[] = this._unplayedEngine.calculate(request);
        const rounds: TournamentRoundDto[] = this.flattenAllRounds(request);
        let remainingSides: TournamentSideDto[] = request.sides.filter(s => !!s);

        return unplayedRounds.map((unplayedRound: ILayoutDataForRound, index: number): ILayoutDataForRound => {
            const playedRound: TournamentRoundDto = rounds[index];
            if (!playedRound) {
                const adaptedRound: ILayoutDataForRound = Object.assign({}, unplayedRound);
                adaptedRound.possibleSides = remainingSides.filter(s => !!s); // copy the array so it cannot be modified
                return adaptedRound;
            }

            const winners: TournamentSideDto[] = [];
            const round: ILayoutDataForRound = this.createRound(request.context, playedRound, unplayedRound, winners, remainingSides, unplayedRounds[index + 1]);
            const unselectedSides: TournamentSideDto[] = remainingSides.filter((remainingSide: TournamentSideDto) => {
                return !any(round.alreadySelectedSides, (s: TournamentSideDto) => s.id === remainingSide.id); // exclude any already selected side
            });
            remainingSides = winners.concat(unselectedSides);
            return round;
        });
    }

    private flattenAllRounds(request: ILayoutRequest): TournamentRoundDto[] {
        let currentRound: TournamentRoundDto = request.round;
        const rounds: TournamentRoundDto[] = [];

        while (currentRound) {
            rounds.push(currentRound);
            currentRound = currentRound.nextRound;
        }

        return rounds;
    }

    private createRound(context: ITournamentLayoutGenerationContext, playedRound: TournamentRoundDto, unplayedRound: ILayoutDataForRound,
                         winners: TournamentSideDto[], remainingSides: TournamentSideDto[], nextRound?: ILayoutDataForRound): ILayoutDataForRound {
        const alreadySelectedSides: TournamentSideDto[] = unplayedRound.alreadySelectedSides || []; // sides will be added in as matches are created

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
                    const unplayedMatchWithoutOnTheNightMnemonic: ILayoutDataForMatch = Object.assign({}, unplayedMatch);
                    if (any(playedRound.matches, (m: TournamentMatchDto) => !!m.sideA || !!m.sideB)) {
                        unplayedMatchWithoutOnTheNightMnemonic.numberOfSidesOnTheNight = undefined;
                    }
                    return unplayedMatchWithoutOnTheNightMnemonic;
                }

                return this.createMatch(context, playedRound, unplayedMatch, playedMatch, index, alreadySelectedSides, winners, nextRound);
            }).concat(this.getExtraMatches(context, playedRound, unplayedRound.matches.length, alreadySelectedSides, winners)),
        };
    }

    private setSidePlayingInNextRound(side: TournamentSideDto, nextRound: ILayoutDataForRound, unplayedMatch: ILayoutDataForMatch) {
        if (!nextRound) {
            return;
        }

        for (const match of nextRound.matches) {
            if (match.sideA.mnemonic === `winner(${unplayedMatch.mnemonic})`) {
                match.sideA.mnemonic = side.name;
                unplayedMatch.mnemonic = undefined;
                return;
            }
            if (match.sideB.mnemonic === `winner(${unplayedMatch.mnemonic})`) {
                match.sideB.mnemonic = side.name;
                unplayedMatch.mnemonic = undefined;
                return;
            }
        }
    }

    private createMatch(context: ITournamentLayoutGenerationContext, playedRound: TournamentRoundDto, unplayedMatch: ILayoutDataForMatch,
                         playedMatch: TournamentMatchDto, index: number, alreadySelectedSides: TournamentSideDto[], winners: TournamentSideDto[],
                         nextRound?: ILayoutDataForRound): ILayoutDataForMatch {
        let winner: string = null;
        const matchOptions: GameMatchOptionDto = playedRound.matchOptions[index] || context.matchOptionDefaults;
        const numberOfLegs: number = matchOptions.numberOfLegs;
        if (playedMatch.scoreA > (numberOfLegs / 2.0)) {
            winners.push(playedMatch.sideA);
            winner = 'sideA';
            this.setSidePlayingInNextRound(playedMatch.sideA, nextRound, unplayedMatch);
        } else if (playedMatch.scoreB > (numberOfLegs / 2.0)) {
            winners.push(playedMatch.sideB);
            winner = 'sideB';
            this.setSidePlayingInNextRound(playedMatch.sideB, nextRound, unplayedMatch);
        }
        if (playedMatch.sideA) {
            alreadySelectedSides.push(playedMatch.sideA);
        }
        if (playedMatch.sideB) {
            alreadySelectedSides.push(playedMatch.sideB);
        }

        return {
            sideA: this.getSide(context, playedMatch.sideA, unplayedMatch.sideA.mnemonic),
            sideB: this.getSide(context, playedMatch.sideB, unplayedMatch.sideB.mnemonic),
            scoreA: (playedMatch.scoreA ? playedMatch.scoreA.toString() : null) || '0',
            scoreB: (playedMatch.scoreB ? playedMatch.scoreB.toString() : null) || '0',
            match: playedMatch,
            winner: winner,
            mnemonic: unplayedMatch.mnemonic,
            hideMnemonic: unplayedMatch.hideMnemonic,
            numberOfSidesOnTheNight: undefined,
            matchOptions: unplayedMatch.matchOptions,
            saygId: playedMatch.saygId,
        };
    }

    private getSide(context: ITournamentLayoutGenerationContext, side?: TournamentSideDto, mnemonic?: string): ILayoutDataForSide {
        return {
            id: side ? side.id : null,
            name: side ? side.name: null,
            link: side ? context.getLinkToSide(side) : null,
            mnemonic: side && side.id
                ? null
                : mnemonic
        };
    }

    private getExtraMatches(context: ITournamentLayoutGenerationContext, playedRound: TournamentRoundDto, offset: number,
                            alreadySelectedSides: TournamentSideDto[], winners: TournamentSideDto[]): ILayoutDataForMatch[] {
        const extraMatches: TournamentMatchDto[] = skip(playedRound.matches, offset);

        return extraMatches.map((playedMatch: TournamentMatchDto, extraMatchIndex: number) => {
            let winner: string = null;
            const overallIndex: number = extraMatchIndex + offset;
            const matchOptions: GameMatchOptionDto = playedRound.matchOptions[overallIndex] || context.matchOptionDefaults;
            const numberOfLegs: number = matchOptions.numberOfLegs;
            if (playedMatch.scoreA > (numberOfLegs / 2.0)) {
                winners.push(playedMatch.sideA);
                winner = 'sideA';
            } else if (playedMatch.scoreB > (numberOfLegs / 2.0)) {
                winners.push(playedMatch.sideB);
                winner = 'sideB';
            }
            if (playedMatch.sideA) {
                alreadySelectedSides.push(playedMatch.sideA);
            }
            if (playedMatch.sideB) {
                alreadySelectedSides.push(playedMatch.sideB);
            }

            return {
                sideA: this.getSide(context, playedMatch.sideA, null),
                sideB: this.getSide(context, playedMatch.sideB, null),
                scoreA: (playedMatch.scoreA ? playedMatch.scoreA.toString() : null) || '0',
                scoreB: (playedMatch.scoreB ? playedMatch.scoreB.toString() : null) || '0',
                match: playedMatch,
                winner: winner,
                numberOfSidesOnTheNight: undefined,
                saygId: playedMatch.saygId,
            };
        });
    }
}