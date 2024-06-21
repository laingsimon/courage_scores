import {ILayoutEngine} from "./ILayoutEngine";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {ITournamentLayoutGenerationContext} from "../competition";
import {any} from "../../../helpers/collections";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";

export class PlayedEngine implements ILayoutEngine {
    private readonly _context: ITournamentLayoutGenerationContext;
    private readonly _round: TournamentRoundDto;
    private readonly _unplayedEngine: ILayoutEngine;

    constructor(context: ITournamentLayoutGenerationContext, round: TournamentRoundDto, unplayedEngine: ILayoutEngine) {
        this._round = round;
        this._context = context;
        this._unplayedEngine = unplayedEngine;
    }

    calculate(sides: TournamentSideDto[]): ILayoutDataForRound[] {
        const unplayedRounds: ILayoutDataForRound[] = this._unplayedEngine.calculate(sides);
        const rounds: TournamentRoundDto[] = this.flattenAllRounds();
        let remainingSides: TournamentSideDto[] = sides.filter(s => !!s);

        return unplayedRounds.map((unplayedRound: ILayoutDataForRound, index: number): ILayoutDataForRound => {
            const playedRound: TournamentRoundDto = rounds[index];
            if (!playedRound) {
                const adaptedRound: ILayoutDataForRound = Object.assign({}, unplayedRound);
                adaptedRound.possibleSides = remainingSides.filter(s => !!s); // copy the array so it cannot be modified
                return adaptedRound;
            }

            const winners: TournamentSideDto[] = [];
            const round: ILayoutDataForRound = this.createRound(playedRound, unplayedRound, winners, remainingSides, unplayedRounds[index + 1]);
            const unselectedSides: TournamentSideDto[] = remainingSides.filter((remainingSide: TournamentSideDto) => {
                return !any(round.alreadySelectedSides, (s: TournamentSideDto) => s.id === remainingSide.id); // exclude any already selected side
            });
            remainingSides = winners.concat(unselectedSides);
            return round;
        });
    }

    private flattenAllRounds(): TournamentRoundDto[] {
        let currentRound: TournamentRoundDto = this._round;
        const rounds: TournamentRoundDto[] = [];

        while (currentRound) {
            rounds.push(currentRound);
            currentRound = currentRound.nextRound;
        }

        return rounds;
    }

    private createRound(playedRound: TournamentRoundDto, unplayedRound: ILayoutDataForRound,
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
                    return unplayedMatch;
                }

                return this.createMatch(playedRound, unplayedMatch, playedMatch, index, alreadySelectedSides, winners, nextRound);
            }),
        };
    }

    private setSidePlayingInNextRound(side: TournamentSideDto, nextRound: ILayoutDataForRound, unplayedMatch: ILayoutDataForMatch) {
        if (!nextRound) {
            return;
        }

        for (const match of nextRound.matches) {
            if (match.sideA.mnemonic === `winner(${unplayedMatch.mnemonic})`) {
                match.sideA.mnemonic = side.name;
                return;
            }
            if (match.sideB.mnemonic === `winner(${unplayedMatch.mnemonic})`) {
                match.sideB.mnemonic = side.name;
                return;
            }
        }
    }

    private createMatch(playedRound: TournamentRoundDto, unplayedMatch: ILayoutDataForMatch,
                         playedMatch: TournamentMatchDto, index: number, alreadySelectedSides: TournamentSideDto[], winners: TournamentSideDto[],
                         nextRound?: ILayoutDataForRound): ILayoutDataForMatch {
        let winner: string = null;
        const matchOptions: GameMatchOptionDto = playedRound.matchOptions[index] || this._context.matchOptionDefaults;
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
        alreadySelectedSides.push(playedMatch.sideA);
        alreadySelectedSides.push(playedMatch.sideB);

        return {
            sideA: this.getSide(playedMatch.sideA, unplayedMatch.sideA.mnemonic),
            sideB: this.getSide(playedMatch.sideB, unplayedMatch.sideB.mnemonic),
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

    private getSide(side?: TournamentSideDto, mnemonic?: string): ILayoutDataForSide {
        return {
            id: side ? side.id : null,
            name: side ? side.name: null,
            link: side ? this._context.getLinkToSide(side) : null,
            mnemonic: side && side.id
                ? null
                : mnemonic
        };
    }
}