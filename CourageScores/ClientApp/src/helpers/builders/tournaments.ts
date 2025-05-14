/* istanbul ignore file */

import {BuilderParam, IAddableBuilder, IBuilder} from "./builders";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {createTemporaryId} from "../projection";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {IMatchOptionsBuilder, matchOptionsBuilder} from "./games";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";

export interface ITournamentBuilder extends IAddableBuilder<TournamentGameDto & DivisionTournamentFixtureDetailsDto> {
    type(type: string): ITournamentBuilder;
    address(address: string): ITournamentBuilder;
    winner(name: string, id?: string, teamId?: string): ITournamentBuilder;
    withSide(builder: BuilderParam<ITournamentSideBuilder>): ITournamentBuilder;
    withPlayer(playerOrId: any): ITournamentBuilder;
    date(date: string): ITournamentBuilder;
    notes(notes: string): ITournamentBuilder;
    bestOf(numberOfLegs: number): ITournamentBuilder;
    forSeason(seasonOrId: any): ITournamentBuilder;
    forDivision(divisionOrId: any): ITournamentBuilder;
    proposed(): ITournamentBuilder;
    accoladesCount(): ITournamentBuilder;
    updated(date: string): ITournamentBuilder;
    round(builder: BuilderParam<ITournamentRoundBuilder>): ITournamentBuilder;
    host(host: string): ITournamentBuilder;
    opponent(opponent: string): ITournamentBuilder;
    gender(gender: string): ITournamentBuilder;
    singleRound(): ITournamentBuilder;
    withHiCheck(playerOrName: any, score: number): ITournamentBuilder;
    withOneEighty(playerOrName: any): ITournamentBuilder;
    withFirstRoundMatch(...matchBuilders: BuilderParam<ITournamentMatchBuilder>[]): ITournamentBuilder;
}

export function tournamentBuilder(id?: string): ITournamentBuilder {
    const tournament: TournamentGameDto & DivisionTournamentFixtureDetailsDto = {
        id: id || createTemporaryId(),
        sides: [],
        oneEighties: [],
        over100Checkouts: [],
        players: [],
        address: '',
        date: '',
    };

    const builder: ITournamentBuilder = {
        build: () => tournament,
        addTo: (map: any) => {
            map[tournament.id] = tournament;
            return builder;
        },
        type: (type: string) => {
            tournament.type = type;
            return builder;
        },
        address: (address: string) => {
            tournament.address = address;
            return builder;
        },
        winner: (name: string, id?: string, teamId?: string) => {
            tournament.winningSide = {
                id: id || createTemporaryId(),
                name: name,
                teamId,
            };
            return builder;
        },
        withSide: (b: BuilderParam<ITournamentSideBuilder>, name?: string) => {
            const side = b(sideBuilder(name));
            tournament.sides?.push(side.build());
            return builder;
        },
        withPlayer: (playerOrId: any) => {
            tournament.players?.push(playerOrId.id ? playerOrId.id : playerOrId);
            return builder;
        },
        date: (date: string) => {
            tournament.date = date;
            return builder;
        },
        notes: (notes: string) => {
            tournament.notes = notes;
            return builder;
        },
        bestOf: (numberOfLegs: number) => {
            tournament.bestOf = numberOfLegs;
            return builder;
        },
        forSeason: (seasonOrId: any) => {
            if (seasonOrId.id) {
                tournament.seasonId = seasonOrId.id;
            } else {
                tournament.seasonId = seasonOrId;
            }
            return builder;
        },
        forDivision: (divisionOrId: any) => {
            if (divisionOrId.id) {
                tournament.divisionId = divisionOrId.id;
            } else {
                tournament.divisionId = divisionOrId;
            }
            return builder;
        },
        proposed: () => {
            tournament.proposed = true;
            return builder;
        },
        accoladesCount: () => {
            tournament.accoladesCount = true;
            return builder;
        },
        updated: (date: string) => {
            tournament.updated = date;
            return builder;
        },
        round: (roundOrBuilderFunc: BuilderParam<ITournamentRoundBuilder>) => {
            const round = roundOrBuilderFunc(roundBuilder());
            tournament.round = round.build();
            return builder;
        },
        host: (host: string) => {
            tournament.host = host;
            return builder;
        },
        opponent: (opponent: string) => {
            tournament.opponent = opponent;
            return builder;
        },
        gender: (gender: string) => {
            tournament.gender = gender;
            return builder;
        },
        singleRound: () => {
            tournament.singleRound = true;
            return builder;
        },
        withOneEighty: (playerOrName: any) => {
            if (playerOrName.id) {
                tournament.oneEighties?.push(playerOrName);
            } else {
                tournament.oneEighties?.push({
                    id: createTemporaryId(),
                    name: playerOrName,
                });
            }
            return builder;
        },
        withHiCheck: (playerOrName: any, score: number) => {
            if (playerOrName.id) {
                tournament.over100Checkouts?.push(Object.assign({}, playerOrName, {score}));
            } else {
                tournament.over100Checkouts?.push({
                    id: createTemporaryId(),
                    name: playerOrName,
                    score: score,
                });
            }
            return builder;
        },
        withFirstRoundMatch: (...matchBuilders: ((builder: ITournamentMatchBuilder) => ITournamentMatchBuilder)[]) => {
            const matches: TournamentMatchDto[] = matchBuilders.map(matchBuilderFunc => matchBuilderFunc(tournamentMatchBuilder()).build());
            tournament.firstRoundMatches = (tournament.firstRoundMatches || []).concat(matches);
            return builder;
        }
    };

    return builder;
}

export interface ITournamentSideBuilder extends IBuilder<TournamentSideDto> {
    id(id: string): ITournamentSideBuilder;
    noId(): ITournamentSideBuilder;
    name(name: string): ITournamentSideBuilder;
    teamId(id: string): ITournamentSideBuilder;
    noShow(): ITournamentSideBuilder;
    withPlayer(nameOrPlayer: any, id?: string, divisionId?: string): ITournamentSideBuilder
}

export function sideBuilder(name?: string, id?: string): ITournamentSideBuilder {
    const side: TournamentSideDto = {
        id: id || createTemporaryId(),
        name: name,
        players: [],
    };

    const builder: ITournamentSideBuilder = {
        build: () => side,
        id: (id: string) => {
            side.id = id;
            return builder;
        },
        noId: () => {
            side.id = undefined!;
            return builder;
        },
        name: (name: string) => {
            side.name = name;
            return builder;
        },
        teamId: (id: string) => {
            side.teamId = id;
            return builder;
        },
        noShow: () => {
            side.noShow = true;
            return builder;
        },
        withPlayer: (nameOrPlayer: any, id?: string, divisionId?: string) => {
            const player = nameOrPlayer && nameOrPlayer.id ? nameOrPlayer : {
                id: id || createTemporaryId(),
                name: nameOrPlayer,
                divisionId,
            };
            side.players?.push(player);
            return builder;
        },
    };

    return builder;
}

export interface ITournamentRoundBuilder extends IBuilder<TournamentRoundDto> {
    withMatch(builder: BuilderParam<ITournamentMatchBuilder>, id?: string): ITournamentRoundBuilder;
    round(builder: BuilderParam<ITournamentRoundBuilder>): ITournamentRoundBuilder;
    withMatchOption(builder: BuilderParam<IMatchOptionsBuilder>): ITournamentRoundBuilder;
}

export function roundBuilder(): ITournamentRoundBuilder {
    const round: TournamentRoundDto = {
        matches: [],
        matchOptions: [],
    };

    const builder: ITournamentRoundBuilder = {
        build: () => round,
        withMatch: (b: BuilderParam<ITournamentMatchBuilder>, id?: string) => {
            const match = b(tournamentMatchBuilder(id)).build();
            round.matches?.push(match);
            return builder;
        },
        round: (b: BuilderParam<ITournamentRoundBuilder>) => {
            round.nextRound = b(roundBuilder()).build();
            return builder;
        },
        withMatchOption: (b: BuilderParam<IMatchOptionsBuilder>) => {
            round.matchOptions?.push(b(matchOptionsBuilder()).build());
            return builder;
        }
    };

    return builder;
}

export interface ITournamentMatchBuilder extends IBuilder<TournamentMatchDto> {
    sideA(side: any, score?: number, ...players: TeamPlayerDto[]): ITournamentMatchBuilder;
    sideB(side: any, score?: number, ...players: TeamPlayerDto[]): ITournamentMatchBuilder;
    saygId(id: string): ITournamentMatchBuilder;
    noId(): ITournamentMatchBuilder;
}

export function tournamentMatchBuilder(id?: string): ITournamentMatchBuilder {
    const match: TournamentMatchDto = {
        id: id || createTemporaryId(),
        sideA: null!,
        sideB: null!,
    };

    const builder: ITournamentMatchBuilder = {
        build: () => match,
        sideA: (side: any, score?: number, ...players: TeamPlayerDto[]) => {
            if (side instanceof Function) {
                side = side(sideBuilder()).build();
            }

            match.sideA = side.name
                ? side
                : sideBuilder(side).build();
            if (score !== undefined) {
                match.scoreA = score;
            }
            match.sideA.players = (match.sideA.players || []).concat(players);
            return builder;
        },
        sideB: (side: any, score?: number, ...players: TeamPlayerDto[]) => {
            if (side instanceof Function) {
                side = side(sideBuilder()).build();
            }

            match.sideB = side.name
                ? side
                : sideBuilder(side).build();
            if (score !== undefined) {
                match.scoreB = score;
            }
            match.sideB.players = (match.sideB.players || []).concat(players);
            return builder;
        },
        saygId: (id: string) => {
            match.saygId = id;
            return builder;
        },
        noId: () => {
            match.id = '';
            return builder;
        },
    };

    return builder;
}