import {IAddableBuilder, IBuilder} from "./builders";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {createTemporaryId} from "../projection";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {matchOptionsBuilder} from "./games";

export interface ITournamentBuilder extends IAddableBuilder<TournamentGameDto & DivisionTournamentFixtureDetailsDto> {
    type: (type: string) => ITournamentBuilder;
    address: (address: string) => ITournamentBuilder;
    winner: (name: string, id?: string, teamId?: string) => ITournamentBuilder;
    withSide: (sideOrBuilderFunc: any) => ITournamentBuilder;
    withPlayer: (playerOrId: any) => ITournamentBuilder;
    date: (date: string) => ITournamentBuilder;
    notes: (notes: string) => ITournamentBuilder;
    bestOf: (numberOfLegs: number) => ITournamentBuilder;
    forSeason: (seasonOrId: any) => ITournamentBuilder;
    forDivision: (divisionOrId: any) => ITournamentBuilder;
    proposed: () => ITournamentBuilder;
    accoladesCount: () => ITournamentBuilder;
    updated: (date: string) => ITournamentBuilder;
    round: (roundOrBuilderFunc: any) => ITournamentBuilder;
    host: (host: string) => ITournamentBuilder;
    opponent: (opponent: string) => ITournamentBuilder;
    gender: (gender: string) => ITournamentBuilder;
    singleRound: () => ITournamentBuilder;
    withHiCheck: (playerOrName: any) => ITournamentBuilder;
    withOneEighty: (playerOrName: any, score?: string) => ITournamentBuilder;
}

export function tournamentBuilder(id?: string): ITournamentBuilder {
    const tournament: TournamentGameDto & DivisionTournamentFixtureDetailsDto = {
        id: id || createTemporaryId(),
        sides: [],
        oneEighties: [],
        over100Checkouts: [],
        players: [],
        address: '',
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
        withSide: (sideOrBuilderFunc: any) => {
            const side = sideOrBuilderFunc instanceof Function
                ? sideOrBuilderFunc(sideBuilder())
                : sideOrBuilderFunc;
            tournament.sides.push(side.build ? side.build() : side);
            return builder;
        },
        withPlayer: (playerOrId: any) => {
            tournament.players.push(playerOrId.id ? playerOrId.id : playerOrId);
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
        round: (roundOrBuilderFunc: any) => {
            const round = roundOrBuilderFunc instanceof Function
                ? roundOrBuilderFunc(roundBuilder())
                : roundOrBuilderFunc;
            tournament.round = round.build ? round.build() : round;
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
                tournament.oneEighties.push(playerOrName);
            } else {
                tournament.oneEighties.push({
                    id: createTemporaryId(),
                    name: playerOrName,
                });
            }
            return builder;
        },
        withHiCheck: (playerOrName: any, score?: string) => {
            if (playerOrName.id) {
                tournament.over100Checkouts.push(playerOrName);
            } else {
                tournament.over100Checkouts.push({
                    id: createTemporaryId(),
                    name: playerOrName,
                    notes: score,
                });
            }
            return builder;
        },
    };

    return builder;
}

export interface ITournamentSideBuilder extends IBuilder<TournamentSideDto> {
    id: (id: string) => ITournamentSideBuilder;
    name: (name: string) => ITournamentSideBuilder;
    teamId: (id: string) => ITournamentSideBuilder;
    noShow: () => ITournamentSideBuilder;
    withPlayer: (nameOrPlayer: any, id?: string, divisionId?: string) => ITournamentSideBuilder
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
            side.players.push(player);
            return builder;
        },
    };

    return builder;
}

export interface ITournamentRoundBuilder extends IBuilder<TournamentRoundDto> {
    withMatch: (matchOrBuilderFunc: any, id?: string) => ITournamentRoundBuilder;
    round: (roundOrBuilderFunc: any) => ITournamentRoundBuilder;
    withMatchOption: (matchOptionOrBuilderFunc: any) => ITournamentRoundBuilder;
}

export function roundBuilder(): ITournamentRoundBuilder {
    const round: TournamentRoundDto = {
        matches: [],
        matchOptions: [],
        nextRound: null,
    };

    const builder: ITournamentRoundBuilder = {
        build: () => round,
        withMatch: (matchOrBuilderFunc: any, id?: string) => {
            const match = matchOrBuilderFunc instanceof Function
                ? matchOrBuilderFunc(tournamentMatchBuilder(id))
                : matchOrBuilderFunc;
            round.matches.push(match.build ? match.build() : match);
            return builder;
        },
        round: (roundOrBuilderFunc: any) => {
            const nextRound = roundOrBuilderFunc instanceof Function
                ? roundOrBuilderFunc(roundBuilder())
                : roundOrBuilderFunc;
            round.nextRound = nextRound.build ? nextRound.build() : nextRound;
            return builder;
        },
        withMatchOption: (matchOptionOrBuilderFunc: any) => {
            const matchOption = matchOptionOrBuilderFunc instanceof Function
                ? matchOptionOrBuilderFunc(matchOptionsBuilder())
                : matchOptionOrBuilderFunc;
            round.matchOptions.push(matchOption.build ? matchOption.build() : matchOption);
            return builder;
        }
    };

    return builder;
}

export interface ITournamentMatchBuilder extends IBuilder<TournamentMatchDto> {
    sideA: (side: any, score?: number) => ITournamentMatchBuilder;
    sideB: (side: any, score?: number) => ITournamentMatchBuilder;
    saygId: (id: string) => ITournamentMatchBuilder;
    noId: () => ITournamentMatchBuilder;
}

export function tournamentMatchBuilder(id?: string): ITournamentMatchBuilder {
    const match: TournamentMatchDto = {
        id: id || createTemporaryId(),
        sideA: null,
        sideB: null,
        scoreA: null,
        scoreB: null,
    };

    const builder: ITournamentMatchBuilder = {
        build: () => match,
        sideA: (side: any, score?: number) => {
            match.sideA = side.name
                ? side
                : { id: createTemporaryId(), name: side };
            if (score !== undefined) {
                match.scoreA = score;
            }
            return builder;
        },
        sideB: (side: any, score?: number) => {
            match.sideB = side.name
                ? side
                : { id: createTemporaryId(), name: side };
            if (score !== undefined) {
                match.scoreB = score;
            }
            return builder;
        },
        saygId: (id: string) => {
            match.saygId = id;
            return builder;
        },
        noId: () => {
            match.id = null;
            return builder;
        },
    };

    return builder;
}
