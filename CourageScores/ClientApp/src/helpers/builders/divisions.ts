import {IAddableBuilder, IBuilder} from "./builders";
import {IDatedDivisionFixtureDto} from "../../interfaces/IDatedDivisionFixtureDto";
import {IEditableDivisionFixtureDto} from "../../components/division_fixtures/DivisionFixture";
import {createTemporaryId} from "../projection";
import {IOtherDivisionFixtureDto} from "../../interfaces/dtos/Division/IOtherDivisionFixtureDto";
import {IDivisionFixtureDateDto} from "../../interfaces/dtos/Division/IDivisionFixtureDateDto";
import {IEditableDivisionFixtureDateDto} from "../../interfaces/IEditableDivisionFixtureDateDto";
import {IFixtureDateNoteDto} from "../../interfaces/dtos/IFixtureDateNoteDto";
import {IDivisionDto} from "../../interfaces/dtos/IDivisionDto";
import React from "react";
import {IDivisionDataDto} from "../../interfaces/dtos/Division/IDivisionDataDto";
import {teamBuilder} from "./teams";
import {playerBuilder} from "./players";
import {seasonBuilder} from "./seasons";
import {IDivisionDataContainerProps} from "../../components/DivisionDataContainer";
import {tournamentBuilder} from "./tournaments";

export interface IDivisionFixtureBuilder extends IAddableBuilder<IDatedDivisionFixtureDto> {
    withOtherFixtureUsingUsingAddress: (name: string, id?: string, awayName?: string) => IDivisionFixtureBuilder;
    playing: (home: any, away: any) => IDivisionFixtureBuilder;
    scores: (home: number, away: number) => IDivisionFixtureBuilder;
    bye: (venue: any, id?: string) => IDivisionFixtureBuilder;
    knockout: () => IDivisionFixtureBuilder;
    postponed: () => IDivisionFixtureBuilder;
    originalAwayTeamId: (id: string) => IDivisionFixtureBuilder;
    accoladesCount: () => IDivisionFixtureBuilder;
    proposal: () => IDivisionFixtureBuilder;
}

export function divisionFixtureBuilder(date?: string, id?: string): IDivisionFixtureBuilder {
    const fixture: IDatedDivisionFixtureDto & IEditableDivisionFixtureDto = {
        id: id || createTemporaryId(),
        date,
        fixturesUsingAddress: [],
        homeTeam: null,
    };

    const teamFactory = (t: any, id?: string) => {
        if (t === null || t === undefined) {
            return null;
        }

        if (t && t.id) {
            return t;
        }

        if (t.build) {
            return t.build();
        }

        return {
            id: id || createTemporaryId(),
            name: t,
            address: '',
        };
    }

    const builder: IDivisionFixtureBuilder = {
        build: () => fixture,
        addTo: (map: any) => {
            map[fixture.id] = fixture;
            return builder;
        },
        withOtherFixtureUsingUsingAddress: (name: string, id?: string, awayName?: string) => {
            const otherFixture: IOtherDivisionFixtureDto = {
                id: id || createTemporaryId(),
                divisionId: createTemporaryId(),
                home: {
                    id: createTemporaryId(),
                    name: name
                },
                away: {
                    id: createTemporaryId(),
                    name: awayName || 'AWAY',
                },
            };

            fixture.fixturesUsingAddress.push(otherFixture);
            return builder;
        },
        playing: (home: any, away: any) => {
            fixture.homeTeam = teamFactory(home);
            fixture.awayTeam = teamFactory(away);
            return builder;
        },
        scores: (home: number, away: number) => {
            fixture.homeScore = home;
            fixture.awayScore = away;
            return builder;
        },
        bye: (venue: any, id?: string) => {
            fixture.homeTeam = teamFactory(venue, id);
            fixture.awayTeam = null;
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
        originalAwayTeamId: (id: string) => {
            fixture.originalAwayTeamId = id;
            return builder;
        },
        accoladesCount: () => {
            fixture.accoladesCount = true;
            return builder;
        },
        proposal: () => {
            fixture.proposal = true;
            return builder;
        }
    };

    return builder;
}

export interface IDivisionFixtureDateBuilder extends IBuilder<IDivisionFixtureDateDto & IEditableDivisionFixtureDateDto> {
    knockout: () => IDivisionFixtureDateBuilder;
    withFixture: (fixtureOrModifierFunc: any, id?: string) => IDivisionFixtureDateBuilder;
    withTournament: (tournamentOrModifierFunc: any, id?: string) => IDivisionFixtureDateBuilder;
    withNote: (noteOrModifierFunc: any, id?: string) => IDivisionFixtureDateBuilder;
    isNew: () => IDivisionFixtureDateBuilder;
}

export function fixtureDateBuilder(date?: string): IDivisionFixtureDateBuilder {
    const fixtureDate: IDivisionFixtureDateDto & IEditableDivisionFixtureDateDto = {
        date: date,
        fixtures: [],
        tournamentFixtures: [],
        notes: [],
    };

    const builder: IDivisionFixtureDateBuilder = {
        build: () => fixtureDate,
        knockout: () => {
            fixtureDate.isKnockout = true;
            return builder;
        },
        withFixture: (fixtureOrModifierFunc: any, id?: string) => {
            const fixture = fixtureOrModifierFunc instanceof Function
                ? fixtureOrModifierFunc(divisionFixtureBuilder(date, id))
                : fixtureOrModifierFunc;
            fixtureDate.fixtures.push(fixture.build ? fixture.build() : fixture);
            return builder;
        },
        withTournament: (tournamentOrModifierFunc: any, id?: string) => {
            const tournament = tournamentOrModifierFunc instanceof Function
                ? tournamentOrModifierFunc(tournamentBuilder(id).date(date))
                : tournamentOrModifierFunc;
            fixtureDate.tournamentFixtures.push(tournament.build ? tournament.build() : tournament);
            return builder;
        },
        withNote: (noteOrModifierFunc: any, id?: string) => {
            const note = noteOrModifierFunc instanceof Function
                ? noteOrModifierFunc(noteBuilder(date, id))
                : noteOrModifierFunc;
            fixtureDate.notes.push(note.build ? note.build() : note);
            return builder;
        },
        isNew: () => {
            fixtureDate.isNew = true;
            return builder;
        },
    };

    return builder;
}

export interface INoteBuilder extends IBuilder<IFixtureDateNoteDto> {
    note: (text: string) => INoteBuilder;
    season: (seasonOrId: any) => INoteBuilder;
    division: (divisionOrId: any) => INoteBuilder;
    updated: (date: string) => INoteBuilder;
    noId: () => INoteBuilder;
}

export function noteBuilder(date?: string, id?: string): INoteBuilder {
    const note: IFixtureDateNoteDto = {
        id: id || createTemporaryId(),
        date,
        note: null,
    };

    const builder: INoteBuilder = {
        build: () => note,
        note: (text: string) => {
            note.note = text;
            return builder;
        },
        season: (seasonOrId: any) => {
            note.seasonId = seasonOrId.id ? seasonOrId.id : seasonOrId;
            return builder;
        },
        division: (divisionOrId: any) => {
            note.divisionId = divisionOrId.id ? divisionOrId.id : divisionOrId;
            return builder;
        },
        updated: (date: string) => {
            note.updated = date;
            return builder;
        },
        noId: () => {
            note.id = null;
            return builder;
        },
    };

    return builder;
}

export interface IDivisionBuilder extends IAddableBuilder<IDivisionDto> {
}

export function divisionBuilder(name: string, id?: string): IDivisionBuilder {
    const division: IDivisionDto = {
        id: id || createTemporaryId(),
        name,
    };

    const builder: IDivisionBuilder = {
        build: () => division as IDivisionDto,
        addTo: (map: any) => {
            map[division.id] = division;
            return builder;
        },
    };

    return builder;
}

export interface IDivisionDataBuilder extends IAddableBuilder<IDivisionDataDto & IDivisionDataContainerProps> {
    withFixtureDate: (fixtureDateOrBuilderFunc: any, date?: string) => IDivisionDataBuilder;
    season: (seasonOrBuilderFunc: any, name?: string, id?: string) => IDivisionDataBuilder;
    name: (name?: string) => IDivisionDataBuilder;
    withTeam: (teamOrBuilderFunc: any, name?: string, id?: string) => IDivisionDataBuilder;
    withPlayer: (playerOrBuilderFunc: any, name?: string, id?: string) => IDivisionDataBuilder;

    onReloadDivision: (onReloadDivision: (preventReloadIfIdsAreTheSame?: boolean) => Promise<IDivisionDataDto | null>) => IDivisionDataBuilder;
    setDivisionData: (setDivisionData: (value: (((prevState: IDivisionDataDto) => IDivisionDataDto) | IDivisionDataDto)) => Promise<any>) => IDivisionDataBuilder;
    children: (children: React.ReactNode) => IDivisionDataBuilder;
}

export function divisionDataBuilder(divisionOrId?: any): IDivisionDataBuilder {
    const divisionId = divisionOrId && divisionOrId.id
        ? divisionOrId.id
        : divisionOrId || createTemporaryId();
    const divisionData: IDivisionDataDto & IDivisionDataContainerProps = {
        id: divisionId || createTemporaryId(),
        name: divisionOrId && divisionOrId.name ? divisionOrId.name : null,
        fixtures: [],
        teams: [],
        season: null,
        dataErrors: [],
        players: [],
        setDivisionData: null,
        onReloadDivision: null,
        children: null,
    };

    const builder: IDivisionDataBuilder = {
        build: () => divisionData,
        addTo: (map: any) => {
            map[divisionData.id] = divisionData;
            return builder;
        },
        withFixtureDate: (fixtureDateOrBuilderFunc: any, date?: string) => {
            const fixtureDate = fixtureDateOrBuilderFunc instanceof Function
                ? fixtureDateOrBuilderFunc(fixtureDateBuilder(date))
                : fixtureDateOrBuilderFunc;
            divisionData.fixtures.push(fixtureDate.build ? fixtureDate.build() : fixtureDate);
            return builder;
        },
        season: (seasonOrBuilderFunc: any, name?: string, id?: string) => {
            const season = seasonOrBuilderFunc instanceof Function
                ? seasonOrBuilderFunc(seasonBuilder(name, id))
                : seasonOrBuilderFunc;
            divisionData.season = season.build ? season.build() : season;
            return builder;
        },
        name: (name?: string) => {
            divisionData.name = name;
            return builder;
        },
        withTeam: (teamOrBuilderFunc: any, name?: string, id?: string) => {
            const team = teamOrBuilderFunc instanceof Function
                ? teamOrBuilderFunc(teamBuilder(name, id))
                : teamOrBuilderFunc;
            divisionData.teams.push(team.build ? team.build() : team);
            return builder;
        },
        withPlayer: (playerOrBuilderFunc: any, name?: string, id?: string) => {
            const player = playerOrBuilderFunc instanceof Function
                ? playerOrBuilderFunc(playerBuilder(name, id))
                : playerOrBuilderFunc;
            divisionData.players.push(player.build ? player.build() : player);
            return builder;
        },
        onReloadDivision: (onReloadDivision: (preventReloadIfIdsAreTheSame?: boolean) => Promise<IDivisionDataDto | null>) => {
            divisionData.onReloadDivision = onReloadDivision;
            return builder;
        },
        setDivisionData: (setDivisionData: (value: (((prevState: IDivisionDataDto) => IDivisionDataDto) | IDivisionDataDto)) => Promise<any>) => {
            divisionData.setDivisionData = setDivisionData;
            return builder;
        },
        children: (children: React.ReactNode) => {
            divisionData.children = children;
            return builder;
        },
    };

    return builder;
}
