﻿/* istanbul ignore file */

import {BuilderParam, IAddableBuilder, IBuilder} from "./builders";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {createTemporaryId} from "../projection";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegCompetitorScoreDto} from "../../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";

export interface IRecordedSaygBuilder extends IAddableBuilder<RecordedScoreAsYouGoDto & UpdateRecordedScoreAsYouGoDto> {
    scores(home: number, away?: number): IRecordedSaygBuilder;
    withLeg(id: number, builder?: BuilderParam<ILegBuilder>): IRecordedSaygBuilder;
    yourName(name: string): IRecordedSaygBuilder;
    opponentName(name?: string): IRecordedSaygBuilder;
    updated(updated: string): IRecordedSaygBuilder;
    numberOfLegs(legs: number): IRecordedSaygBuilder;
    startingScore(score: number): IRecordedSaygBuilder;
    lastUpdated(lastUpdated: string): IRecordedSaygBuilder;
    noId(): IRecordedSaygBuilder;
}

export function saygBuilder(id?: string): IRecordedSaygBuilder {
    const sayg: RecordedScoreAsYouGoDto & UpdateRecordedScoreAsYouGoDto = {
        id: id || createTemporaryId(),
        legs: {},
        yourName: '',
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
        withLeg: (id: number, b?: BuilderParam<ILegBuilder>) => {
            sayg.legs[id] = b
                ? b(legBuilder()).build()
                : legBuilder().build();
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
            sayg.id = undefined!;
            return builder;
        }
    };

    return builder;
}

export interface ILegBuilder extends IBuilder<LegDto> {
    startingScore(score: number): ILegBuilder;
    currentThrow(homeOrAway: string): ILegBuilder;
    playerSequence(homeOrAway: string, awayOrHome: string): ILegBuilder;
    lastLeg(): ILegBuilder;
    home(builder?: BuilderParam<ILegCompetitorScoreBuilder>): ILegBuilder;
    away(builder?: BuilderParam<ILegCompetitorScoreBuilder>): ILegBuilder;
}

export function legBuilder(): ILegBuilder {
    const leg: LegDto = {
        home: {},
        away: {},
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
        home: (b?: BuilderParam<ILegCompetitorScoreBuilder>) => {
            leg.home = b
                ? b(saygCompetitorBuilder()).build()
                : saygCompetitorBuilder().build();
            return builder;
        },
        away: (b?: BuilderParam<ILegCompetitorScoreBuilder>) => {
            leg.away = b
                ? b(saygCompetitorBuilder()).build()
                : saygCompetitorBuilder().build();
            return builder;
        },
    };

    return builder;
}

export interface ILegCompetitorScoreBuilder extends IBuilder<LegCompetitorScoreDto> {
    withThrow(score: number, noOfDarts?: number): ILegCompetitorScoreBuilder;
}

export function saygCompetitorBuilder(): ILegCompetitorScoreBuilder {
    const competitor: LegCompetitorScoreDto = {
        throws: [],
        score: 0,
        noOfDarts: 0,
    };

    const builder: ILegCompetitorScoreBuilder = {
        build: () => competitor,
        withThrow: (score: number, noOfDarts?: number) => {
            competitor.throws?.push({
                score: score,
                noOfDarts: noOfDarts || 3,
            });
            competitor.noOfDarts = competitor.noOfDarts || 0;
            competitor.score = competitor.score || 0;
            competitor.noOfDarts += (noOfDarts || 3);
            competitor.score += score;
            return builder;
        },
    };

    return builder;
}