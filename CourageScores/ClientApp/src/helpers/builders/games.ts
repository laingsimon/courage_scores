import {IAddableBuilder, IBuilder} from "./builders";
import {IDatedDivisionFixtureDto} from "../../interfaces/IDatedDivisionFixtureDto";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {createTemporaryId} from "../projection";
import {GameMatchDto} from "../../interfaces/models/dtos/Game/GameMatchDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {playerBuilder} from "./players";
import {saygBuilder} from "./sayg";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";

export interface IFixtureBuilder extends IAddableBuilder<IDatedDivisionFixtureDto & GameDto> {
    playing: (home?: any, away?: any) => IFixtureBuilder;
    bye: (venue: any, id?: string) => IFixtureBuilder;
    manOfTheMatch: (homePlayerOrId: any, awayPlayerOrId?: any) => IFixtureBuilder;
    knockout: () => IFixtureBuilder;
    postponed: () => IFixtureBuilder;
    accoladesCount: () => IFixtureBuilder;
    address: (address: string) => IFixtureBuilder;
    forSeason: (seasonOrId: any) => IFixtureBuilder;
    forDivision: (divisionOrId: any) => IFixtureBuilder;
    with180: (playerOrName: any) => IFixtureBuilder;
    withHiCheck: (playerOrName: any, score: number) => IFixtureBuilder;
    withMatch: (matchOrBuilderFunc: any) => IFixtureBuilder;
    withMatchOption: (matchOptionOrBuilderFunc: any) => IFixtureBuilder;
    editor: (name: string) => IFixtureBuilder;
    author: (name: string) => IFixtureBuilder;
    homeSubmission?: (submissionOrBuilderFunc?: any, id?: string) => IFixtureBuilder;
    awaySubmission?: (submissionOrBuilderFunc?: any, id?: string) => IFixtureBuilder;
}

export function fixtureBuilder(date?: string, id?: string, omitSubmission?: boolean): IFixtureBuilder {
    const fixture: IDatedDivisionFixtureDto & GameDto = {
        id: id || createTemporaryId(),
        date: date,
        oneEighties: [],
        over100Checkouts: [],
        matches: [],
        matchOptions: [],
        homeTeam: null,
        away: null,
        address: null,
        home: null,
    };

    const teamFactory = (t?: any, id?: string) => {
        if (t === null || t === undefined) {
            return null;
        }

        if (t && t.id) {
            return t;
        }

        return {
            id: id || createTemporaryId(),
            name: t,
        };
    }

    const builder: IFixtureBuilder = {
        build: () => fixture,
        addTo: (map: any) => {
            map[fixture.id] = fixture;
            return builder;
        },
        playing: (home?: any, away?: any) => {
            fixture.home = teamFactory(home);
            fixture.away = teamFactory(away);
            return builder;
        },
        bye: (venue: any, id?: string) => {
            fixture.homeTeam = teamFactory(venue, id);
            fixture.awayTeam = null;
            return builder;
        },
        manOfTheMatch: (homePlayerOrId: string | TeamPlayerDto | null, awayPlayerOrId: string | TeamPlayerDto | null) => {
            function getId(playerOrId: string | TeamPlayerDto): string {
                const player: TeamPlayerDto = playerOrId as TeamPlayerDto;
                if (player.id) {
                    return player.id;
                }

                return playerOrId as string;
            }

            if (homePlayerOrId) {
                fixture.home.manOfTheMatch = getId(homePlayerOrId);
            }
            if (awayPlayerOrId) {
                fixture.away.manOfTheMatch = getId(awayPlayerOrId);
            }
            return builder;
        },
        knockout: () => {
            fixture.isKnockout = true;
            return builder;
        },
        postponed: () => {
            fixture.postponed = true;
            return builder;
        },
        accoladesCount: () => {
            fixture.accoladesCount = true;
            return builder;
        },
        address: (address: string) => {
            fixture.address = address;
            return builder;
        },
        forSeason: (seasonOrId: any) => {
            fixture.seasonId = seasonOrId.id ? seasonOrId.id : seasonOrId;
            return builder;
        },
        forDivision: (divisionOrId: any) => {
            fixture.divisionId = divisionOrId.id ? divisionOrId.id : divisionOrId;
            return builder;
        },
        with180: (playerOrName: any) => {
            fixture.oneEighties.push(!playerOrName || playerOrName.name ? playerOrName : {
                id: createTemporaryId(),
                name: playerOrName,
            });
            return builder;
        },
        withHiCheck: (playerOrName: any, score: number) => {
            const player = !playerOrName || playerOrName.name ? playerOrName : {
                id: createTemporaryId(),
                name: playerOrName
            };

            fixture.over100Checkouts.push(Object.assign({}, player, { score }));
            return builder;
        },
        withMatch: (matchOrBuilderFunc: any) => {
            const match = matchOrBuilderFunc instanceof Function
                ? matchOrBuilderFunc(matchBuilder())
                : matchOrBuilderFunc;
            fixture.matches.push(match.build ? match.build() : match);
            return builder;
        },
        withMatchOption: (matchOptionOrBuilderFunc: any) => {
            const matchOption = matchOptionOrBuilderFunc instanceof Function
                ? matchOptionOrBuilderFunc(matchOptionsBuilder())
                : matchOptionOrBuilderFunc;
            fixture.matchOptions.push(matchOption.build ? matchOption.build() : matchOption);
            return builder;
        },
        editor: (name: string) => {
            fixture.editor = name;
            return builder;
        },
        author: (name: string) => {
            fixture.author = name;
            return builder;
        },
    };

    if (!omitSubmission) {
        // don't allow home/away submissions for home/away submissions - only at root level

        builder.homeSubmission = (submissionOrBuilderFunc?: any, id?: string) => {
            const submission = submissionOrBuilderFunc instanceof Function
                ? submissionOrBuilderFunc(fixtureBuilder(fixture.date, id || fixture.id, true))
                : submissionOrBuilderFunc;
            fixture.homeSubmission = submission && submission.build ? submission.build() : submission;
            return builder;
        };
        builder.awaySubmission = (submissionOrBuilderFunc?: any, id?: string) => {
            const submission = submissionOrBuilderFunc instanceof Function
                ? submissionOrBuilderFunc(fixtureBuilder(fixture.date, id || fixture.id, true))
                : submissionOrBuilderFunc;
            fixture.awaySubmission = submission && submission.build ? submission.build() : submission;
            return builder;
        };
    }

    return builder;
}

export interface IMatchBuilder extends IBuilder<GameMatchDto> {
    withHome: (playerOrName?: any) => IMatchBuilder;
    withAway: (playerOrName?: any) => IMatchBuilder;
    scores: (home: any, away: any) => IMatchBuilder;
    sayg: (saygOrBuilderFunc: any, id?: any) => IMatchBuilder;
}

export function matchBuilder(): IMatchBuilder {
    const match: GameMatchDto = {};

    const builder: IMatchBuilder = {
        build: () => match,
        withHome: (playerOrName?: any) => {
            match.homePlayers = match.homePlayers || [];
            if (playerOrName) {
                const player = playerOrName.id ? playerOrName : playerBuilder(playerOrName).build();
                match.homePlayers.push(player);
            }
            return builder;
        },
        withAway: (playerOrName?: any) => {
            match.awayPlayers = match.awayPlayers || [];
            if (playerOrName) {
                const player = playerOrName.id ? playerOrName : playerBuilder(playerOrName).build();
                match.awayPlayers.push(player);
            }
            return builder;
        },
        scores: (home: any, away: any) => {
            match.homeScore = home;
            match.awayScore = away;
            return builder;
        },
        sayg: (saygOrBuilderFunc: any, id?: any) => {
            const sayg = saygOrBuilderFunc instanceof Function
                ? saygOrBuilderFunc(saygBuilder(id))
                : saygOrBuilderFunc;
            match.sayg = sayg.build ? sayg.build() : sayg;
            return builder;
        }
    };

    return builder;
}

export interface IMatchOptionsBuilder extends IBuilder<GameMatchOptionDto>{
    numberOfLegs: (legs: number) => IMatchOptionsBuilder;
    startingScore: (score: number) => IMatchOptionsBuilder;
    playerCount: (count: number) => IMatchOptionsBuilder;
}

export function matchOptionsBuilder(): IMatchOptionsBuilder {
    const options: GameMatchOptionDto = {
        startingScore: null,
        numberOfLegs: null,
    };

    const builder: IMatchOptionsBuilder = {
        build: () => options,
        numberOfLegs: (legs: number) => {
            options.numberOfLegs = legs;
            return builder;
        },
        startingScore: (score: number) => {
            options.startingScore = score;
            return builder;
        },
        playerCount: (count: number) => {
            options.playerCount = count;
            return builder;
        },
    };

    return builder;
}
