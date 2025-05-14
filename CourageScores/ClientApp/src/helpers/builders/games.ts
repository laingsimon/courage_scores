/* istanbul ignore file */

import {BuilderParam, IAddableBuilder, IBuilder} from "./builders";
import {IDatedDivisionFixtureDto} from "../../components/division_fixtures/IDatedDivisionFixtureDto";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {createTemporaryId} from "../projection";
import {GameMatchDto} from "../../interfaces/models/dtos/Game/GameMatchDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {IRecordedSaygBuilder, saygBuilder} from "./sayg";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {GameTeamDto} from "../../interfaces/models/dtos/Game/GameTeamDto";
import {teamBuilder} from "./teams";

export interface IFixtureBuilder extends IAddableBuilder<IDatedDivisionFixtureDto & GameDto> {
    playing(home: string, away: string): IFixtureBuilder;
    teams(home: GameTeamDto, away: GameTeamDto): IFixtureBuilder;
    bye(venue: string, id?: string): IFixtureBuilder;
    manOfTheMatch(homePlayer?: TeamPlayerDto, awayPlayer?: TeamPlayerDto): IFixtureBuilder;
    knockout(): IFixtureBuilder;
    postponed(): IFixtureBuilder;
    accoladesCount(): IFixtureBuilder;
    address(address: string): IFixtureBuilder;
    forSeason(season: SeasonDto): IFixtureBuilder;
    forDivision(division: DivisionDto): IFixtureBuilder;
    with180(player: TeamPlayerDto): IFixtureBuilder;
    withHiCheck(player: TeamPlayerDto, score: number): IFixtureBuilder;
    withMatch(builder: BuilderParam<IMatchBuilder>): IFixtureBuilder;
    withMatchOption(builder: BuilderParam<IMatchOptionsBuilder>): IFixtureBuilder;
    editor(name: string): IFixtureBuilder;
    author(name: string): IFixtureBuilder;
    homeSubmission(builder: BuilderParam<IFixtureBuilder>, id?: string): IFixtureBuilder;
    awaySubmission(builder: BuilderParam<IFixtureBuilder>, id?: string): IFixtureBuilder;
    updated(time: string): IFixtureBuilder;
}

export function fixtureBuilder(date?: string, id?: string): IFixtureBuilder {
    const fixture: IDatedDivisionFixtureDto & GameDto = {
        id: id || createTemporaryId(),
        date: date || '',
        oneEighties: [],
        over100Checkouts: [],
        matches: [],
        matchOptions: [],
        homeTeam: { name: '' },
        away: null!,
        address: '',
        home: null!,
    };

    const builder: IFixtureBuilder = {
        build: () => fixture,
        addTo: (map: { [key: string]: IDatedDivisionFixtureDto & GameDto }) => {
            map[fixture.id] = fixture;
            return builder;
        },
        playing: (home: string, away: string) => {
            fixture.home = teamBuilder(home).build();
            fixture.away = teamBuilder(away).build();
            return builder;
        },
        teams: (home: GameTeamDto, away: GameTeamDto) => {
            fixture.home = home;
            fixture.away = away;
            return builder;
        },
        bye: (venue: string, id?: string) => {
            fixture.homeTeam = teamBuilder(venue, id).build();
            fixture.awayTeam = undefined;
            return builder;
        },
        manOfTheMatch: (homePlayer?: TeamPlayerDto, awayPlayer?: TeamPlayerDto) => {
            if (homePlayer) {
                fixture.home.manOfTheMatch = homePlayer.id;
            }
            if (awayPlayer) {
                fixture.away.manOfTheMatch = awayPlayer.id;
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
        forSeason: (season: SeasonDto) => {
            fixture.seasonId = season.id;
            return builder;
        },
        forDivision: (division: DivisionDto) => {
            fixture.divisionId = division.id;
            return builder;
        },
        with180: (player: TeamPlayerDto) => {
            fixture.oneEighties?.push(player);
            return builder;
        },
        withHiCheck: (player: TeamPlayerDto, score: number) => {
            fixture.over100Checkouts?.push(Object.assign({}, player, { score }));
            return builder;
        },
        withMatch: (b: BuilderParam<IMatchBuilder>) => {
            const match = b(matchBuilder());
            fixture.matches?.push(match.build());
            return builder;
        },
        withMatchOption: (b: BuilderParam<IMatchOptionsBuilder>) => {
            const matchOption = b(matchOptionsBuilder());
            fixture.matchOptions?.push(matchOption.build());
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
        updated: (date: string) => {
            fixture.updated = date;
            return builder;
        },
        homeSubmission: (b: BuilderParam<IFixtureBuilder>, id?: string) => {
            const submission = b(fixtureBuilder(fixture.date, id || fixture.id));
            fixture.homeSubmission = submission.build();
            return builder;
        },
        awaySubmission: (b: BuilderParam<IFixtureBuilder>, id?: string) => {
            const submission = b(fixtureBuilder(fixture.date, id || fixture.id));
            fixture.awaySubmission = submission.build();
            return builder;
        },
    };

    return builder;
}

export interface IMatchBuilder extends IBuilder<GameMatchDto> {
    withHome(player?: TeamPlayerDto): IMatchBuilder;
    withAway(player?: TeamPlayerDto): IMatchBuilder;
    scores(home?: number, away?: number): IMatchBuilder;
    sayg(builder: BuilderParam<IRecordedSaygBuilder>): IMatchBuilder;
}

export function matchBuilder(): IMatchBuilder {
    const match: GameMatchDto = {};

    const builder: IMatchBuilder = {
        build: () => match,
        withHome: (player?: TeamPlayerDto) => {
            match.homePlayers = match.homePlayers || [];
            if (player) {
                match.homePlayers.push(player);
            }
            return builder;
        },
        withAway: (player?: TeamPlayerDto) => {
            match.awayPlayers = match.awayPlayers || [];
            if (player) {
                match.awayPlayers.push(player);
            }
            return builder;
        },
        scores: (home?: number, away?: number) => {
            match.homeScore = home;
            match.awayScore = away;
            return builder;
        },
        sayg: (b: BuilderParam<IRecordedSaygBuilder>) => {
            match.sayg = b(saygBuilder()).build();
            return builder;
        }
    };

    return builder;
}

export interface IMatchOptionsBuilder extends IBuilder<GameMatchOptionDto>{
    numberOfLegs(legs: number): IMatchOptionsBuilder;
    startingScore(score: number): IMatchOptionsBuilder;
    playerCount(count: number): IMatchOptionsBuilder;
}

export function matchOptionsBuilder(): IMatchOptionsBuilder {
    const options: GameMatchOptionDto = {};

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