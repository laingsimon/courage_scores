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
            const round: ILayoutDataForRound = this.createRound(request.context!, playedRound, unplayedRound, winners, remainingSides, unplayedRounds[index + 1]);
            const unselectedSides: TournamentSideDto[] = remainingSides.filter((remainingSide: TournamentSideDto) => {
                return !any(round.alreadySelectedSides, (s: TournamentSideDto) => s.id === remainingSide.id); // exclude any already selected side
            });
            remainingSides = winners.concat(unselectedSides);
            return round;
        });
    }

    private flattenAllRounds(request: ILayoutRequest): TournamentRoundDto[] {
        let currentRound: TournamentRoundDto | undefined = request.round;
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
                const playedMatch: TournamentMatchDto | null = playedRound ? playedRound.matches![index] : null;
                if (!playedMatch) {
                    // add to unplayed sides
                    const unplayedMatchWithoutOnTheNightMnemonic: ILayoutDataForMatch = Object.assign({}, unplayedMatch);
                    if (any(playedRound.matches || [], (m: TournamentMatchDto) => !!m.sideA || !!m.sideB)) {
                        unplayedMatchWithoutOnTheNightMnemonic.numberOfSidesOnTheNight = undefined;
                    }
                    return unplayedMatchWithoutOnTheNightMnemonic;
                }

                return this.createMatch(context, playedRound, unplayedMatch, playedMatch, index, alreadySelectedSides, winners, nextRound);
            }).concat(this.getExtraMatches(context, playedRound, unplayedRound.matches.length, alreadySelectedSides, winners)),
        };
    }

    private createMatch(context: ITournamentLayoutGenerationContext, playedRound: TournamentRoundDto, unplayedMatch: ILayoutDataForMatch,
                         playedMatch: TournamentMatchDto, index: number, alreadySelectedSides: TournamentSideDto[], winners: TournamentSideDto[],
                         nextRound?: ILayoutDataForRound): ILayoutDataForMatch {
        const matchOptions: GameMatchOptionDto = playedRound.matchOptions![index] || context.matchOptionDefaults;
        const winner: string | undefined = this.getMatchWinner(
            matchOptions,
            winners,
            playedMatch,
            unplayedMatch,
            nextRound);
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
            matchOptions: matchOptions,
            saygId: playedMatch.saygId,
        };
    }

    private getExtraMatches(context: ITournamentLayoutGenerationContext, playedRound: TournamentRoundDto, offset: number,
                            alreadySelectedSides: TournamentSideDto[], winners: TournamentSideDto[]): ILayoutDataForMatch[] {
        const extraMatches: TournamentMatchDto[] = skip(playedRound.matches || [], offset);

        return extraMatches.map((playedMatch: TournamentMatchDto, extraMatchIndex: number): ILayoutDataForMatch => {
            const overallIndex: number = extraMatchIndex + offset;
            const winner: string | undefined = this.getMatchWinner(
                playedRound.matchOptions![overallIndex] || context.matchOptionDefaults,
                winners,
                playedMatch);
            if (playedMatch.sideA) {
                alreadySelectedSides.push(playedMatch.sideA);
            }
            if (playedMatch.sideB) {
                alreadySelectedSides.push(playedMatch.sideB);
            }

            return {
                sideA: this.getSide(context, playedMatch.sideA),
                sideB: this.getSide(context, playedMatch.sideB),
                scoreA: (playedMatch.scoreA ? playedMatch.scoreA.toString() : null) || '0',
                scoreB: (playedMatch.scoreB ? playedMatch.scoreB.toString() : null) || '0',
                match: playedMatch,
                winner: winner,
                saygId: playedMatch.saygId,
            };
        });
    }

    private getMatchWinner(matchOptions: GameMatchOptionDto, winners: TournamentSideDto[],
                           playedMatch: TournamentMatchDto, unplayedMatch?: ILayoutDataForMatch, nextRound?: ILayoutDataForRound): string | undefined {
        const numberOfLegs: number = matchOptions.numberOfLegs || 5;
        if (playedMatch.scoreA! > (numberOfLegs / 2.0)) {
            winners.push(playedMatch.sideA);
            this.setSidePlayingInNextRound(playedMatch.sideA, nextRound, unplayedMatch);
            return 'sideA';
        } else if (playedMatch.scoreB! > (numberOfLegs / 2.0)) {
            winners.push(playedMatch.sideB);
            this.setSidePlayingInNextRound(playedMatch.sideB, nextRound, unplayedMatch);
            return 'sideB';
        }
    }

    private getSide(context: ITournamentLayoutGenerationContext, side?: TournamentSideDto, mnemonic?: string): ILayoutDataForSide {
        return {
            id: side ? side.id : '',
            name: side ? side.name! : '',
            link: side ? context.getLinkToSide(side) : undefined,
            mnemonic: side && side.id
                ? undefined
                : mnemonic
        };
    }

    private setSidePlayingInNextRound(side: TournamentSideDto, nextRound?: ILayoutDataForRound, unplayedMatch?: ILayoutDataForMatch) {
        if (!nextRound) {
            return;
        }

        for (const match of nextRound.matches) {
            if (match.sideA.mnemonic === `winner(${unplayedMatch?.mnemonic})`) {
                match.sideA.mnemonic = side.name;
                unplayedMatch!.mnemonic = undefined;
                return;
            }
            if (match.sideB.mnemonic === `winner(${unplayedMatch?.mnemonic})`) {
                match.sideB.mnemonic = side.name;
                unplayedMatch!.mnemonic = undefined;
                return;
            }
        }
    }
}