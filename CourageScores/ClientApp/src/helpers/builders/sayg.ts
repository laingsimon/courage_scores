import {IAddableBuilder, IBuilder} from "./builders";
import {IRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/IRecordedScoreAsYouGoDto";
import {createTemporaryId} from "../projection";
import {ILegDto} from "../../interfaces/models/dtos/Game/Sayg/ILegDto";
import {ILegCompetitorScoreDto} from "../../interfaces/models/dtos/Game/Sayg/ILegCompetitorScoreDto";
import {IUpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/IUpdateRecordedScoreAsYouGoDto";

export interface IRecordedSaygBuilder extends IAddableBuilder<IRecordedScoreAsYouGoDto & IUpdateRecordedScoreAsYouGoDto> {
    scores: (home: number, away?: number) => IRecordedSaygBuilder;
    withLeg: (id: number, legOrBuilderFunc: any) => IRecordedSaygBuilder;
    yourName: (name: string) => IRecordedSaygBuilder;
    opponentName: (name?: string) => IRecordedSaygBuilder;
    updated: (updated: string) => IRecordedSaygBuilder;
    numberOfLegs: (legs: number) => IRecordedSaygBuilder;
    startingScore: (score: number) => IRecordedSaygBuilder;
    lastUpdated: (lastUpdated: string) => IRecordedSaygBuilder;
    noId: () => IRecordedSaygBuilder;
}

export function saygBuilder(id?: string): IRecordedSaygBuilder {
    const sayg: IRecordedScoreAsYouGoDto & IUpdateRecordedScoreAsYouGoDto = {
        id: id || createTemporaryId(),
        legs: {},
        yourName: null,
    };

    const builder: IRecordedSaygBuilder = {
        build: () => sayg,
        addTo: (map: any) => {
            map[sayg.id] = sayg;
            return builder;
        },
        scores: (home: number, away?: number) => {
            sayg.homeScore = home;
            sayg.awayScore = away;
            return builder;
        },
        withLeg: (id: number, legOrBuilderFunc: any) => {
            const leg = legOrBuilderFunc instanceof Function
                ? legOrBuilderFunc(legBuilder())
                : legOrBuilderFunc;
            sayg.legs[id] = leg.build ? leg.build() : leg;
            return builder;
        },
        yourName: (name: string) => {
            sayg.yourName = name;
            return builder;
        },
        opponentName: (name?: string) => {
            sayg.opponentName = name;
            return builder;
        },
        updated: (updated: string) => {
            sayg.updated = updated;
            return builder;
        },
        numberOfLegs: (legs: number) => {
            sayg.numberOfLegs = legs;
            return builder;
        },
        startingScore: (score: number) => {
            sayg.startingScore = score;
            return builder;
        },
        lastUpdated: (lastUpdated: string) => {
            sayg.lastUpdated = lastUpdated;
            return builder;
        },
        noId: () => {
            delete sayg.id;
            return builder;
        }
    };

    return builder;
}

export interface ILegBuilder extends IBuilder<ILegDto> {
    startingScore: (score: number) => ILegBuilder;
    currentThrow: (homeOrAway: string) => ILegBuilder;
    playerSequence: (homeOrAway: string, awayOrHome: string) => ILegBuilder;
    lastLeg: () => ILegBuilder;
    home: (competitorOrBuilderFunc: any) => ILegBuilder;
    away: (competitorOrBuilderFunc: any) => ILegBuilder;
    winner: (designation: string) => ILegBuilder;
}

export function legBuilder(): ILegBuilder {
    const leg: ILegDto = {
        home: null,
        away: null,
        isLastLeg: false,
    };

    const builder: ILegBuilder = {
        build: () => leg,
        startingScore: (score: number) => {
            leg.startingScore = score;
            return builder;
        },
        currentThrow: (homeOrAway: string) => {
            leg.currentThrow = homeOrAway;
            return builder;
        },
        playerSequence: (homeOrAway: string, awayOrHome: string) => {
            leg.playerSequence = [
                { value: homeOrAway, text: homeOrAway.toUpperCase() },
                { value: awayOrHome, text: awayOrHome.toUpperCase() },
            ];
            return builder;
        },
        lastLeg: () => {
            leg.isLastLeg = true;
            return builder;
        },
        home: (competitorOrBuilderFunc: any) => {
            const competitor = competitorOrBuilderFunc instanceof Function
                ? competitorOrBuilderFunc(saygCompetitorBuilder())
                : competitorOrBuilderFunc;
            leg.home = competitor.build ? competitor.build() : competitor;
            return builder;
        },
        away: (competitorOrBuilderFunc: any) => {
            const competitor = competitorOrBuilderFunc instanceof Function
                ? competitorOrBuilderFunc(saygCompetitorBuilder())
                : competitorOrBuilderFunc;
            leg.away = competitor.build ? competitor.build() : competitor;
            return builder;
        },
        winner: (designation: string) => {
            leg.winner = designation;
            return builder;
        },
    };

    return builder;
}

export interface ILegCompetitorScoreBuilder extends IBuilder<ILegCompetitorScoreDto> {
    withThrow: (score: number, bust?: boolean, noOfDarts?: number) => ILegCompetitorScoreBuilder;
    score: (score: number) => ILegCompetitorScoreBuilder;
    noOfDarts: (noOfDarts: number) => ILegCompetitorScoreBuilder;
    bust: () => ILegCompetitorScoreBuilder;
}

export function saygCompetitorBuilder(): ILegCompetitorScoreBuilder {
    const competitor: ILegCompetitorScoreDto = {
        throws: [],
        score: 0,
        bust: false,
        noOfDarts: 0,
    };

    const builder: ILegCompetitorScoreBuilder = {
        build: () => competitor,
        withThrow: (score: number, bust?: boolean, noOfDarts?: number) => {
            competitor.throws.push({
                score: score,
                bust: bust || false,
                noOfDarts,
            });
            return builder;
        },
        score: (score: number) => {
            competitor.score = score;
            return builder;
        },
        noOfDarts: (noOfDarts: number) => {
            competitor.noOfDarts = noOfDarts;
            return builder;
        },
        bust: () => {
            competitor.bust = true;
            return builder;
        },
    };

    return builder;
}
