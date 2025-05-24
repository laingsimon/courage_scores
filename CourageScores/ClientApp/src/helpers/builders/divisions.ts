/* istanbul ignore file */

import {BuilderParam, IAddableBuilder, IBuilder} from "./builders";
import {IDatedDivisionFixtureDto} from "../../components/division_fixtures/IDatedDivisionFixtureDto";
import {IEditableDivisionFixtureDto} from "../../components/division_fixtures/DivisionFixture";
import {createTemporaryId} from "../projection";
import {OtherDivisionFixtureDto} from "../../interfaces/models/dtos/Division/OtherDivisionFixtureDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {IEditableDivisionFixtureDateDto} from "../../components/division_fixtures/IEditableDivisionFixtureDateDto";
import {FixtureDateNoteDto} from "../../interfaces/models/dtos/FixtureDateNoteDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {teamBuilder} from "./teams";
import {playerBuilder} from "./players";
import {ISeasonBuilder, seasonBuilder} from "./seasons";
import {IDivisionDataContainerProps} from "../../components/league/DivisionDataContainer";
import {ITournamentBuilder, tournamentBuilder} from "./tournaments";
import {ReactNode} from "react";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {noop} from "../tests";

export interface IDivisionFixtureBuilder extends IAddableBuilder<IDatedDivisionFixtureDto> {
    withOtherFixtureUsingUsingAddress(name: string, id?: string, awayName?: string): IDivisionFixtureBuilder;
    playing(home: any, away: any): IDivisionFixtureBuilder;
    scores(home?: number, away?: number): IDivisionFixtureBuilder;
    bye(venue: any, id?: string): IDivisionFixtureBuilder;
    knockout(): IDivisionFixtureBuilder;
    postponed(): IDivisionFixtureBuilder;
    originalAwayTeamId(id: string): IDivisionFixtureBuilder;
    accoladesCount(): IDivisionFixtureBuilder;
    proposal(): IDivisionFixtureBuilder;
}

export function divisionFixtureBuilder(date?: string, id?: string): IDivisionFixtureBuilder {
    const fixture: IDatedDivisionFixtureDto & IEditableDivisionFixtureDto = {
        id: id || createTemporaryId(),
        date: date || '',
        fixturesUsingAddress: [],
        homeTeam: { name: '' },
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
            map[fixture.id || ''] = fixture;
            return builder;
        },
        withOtherFixtureUsingUsingAddress: (name: string, id?: string, awayName?: string) => {
            const otherFixture: OtherDivisionFixtureDto = {
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

            fixture.fixturesUsingAddress?.push(otherFixture);
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
            fixture.awayTeam = undefined;
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

export interface IDivisionFixtureDateBuilder extends IBuilder<DivisionFixtureDateDto & IEditableDivisionFixtureDateDto> {
    knockout(): IDivisionFixtureDateBuilder;
    withFixture(builder: BuilderParam<IDivisionFixtureBuilder>, id?: string): IDivisionFixtureDateBuilder;
    withTournament(builder: BuilderParam<ITournamentBuilder>, id?: string): IDivisionFixtureDateBuilder;
    withNote(builder: BuilderParam<INoteBuilder>, id?: string): IDivisionFixtureDateBuilder;
    isNew(): IDivisionFixtureDateBuilder;
}

export function fixtureDateBuilder(date?: string): IDivisionFixtureDateBuilder {
    const fixtureDate: DivisionFixtureDateDto & IEditableDivisionFixtureDateDto = {
        date: date || 'unknown date',
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
        withFixture: (b: BuilderParam<IDivisionFixtureBuilder>, id?: string) => {
            const fixture = b(divisionFixtureBuilder(date, id));
            fixtureDate.fixtures?.push(fixture.build());
            return builder;
        },
        withTournament: (b: BuilderParam<ITournamentBuilder>, id?: string) => {
            const tournament = b(tournamentBuilder(id).date(date || '')).build();
            fixtureDate.tournamentFixtures?.push(tournament);
            return builder;
        },
        withNote: (modifierFunc: BuilderParam<INoteBuilder>, id?: string) => {
            const note = modifierFunc(noteBuilder(date, id));
            fixtureDate.notes?.push(note.build());
            return builder;
        },
        isNew: () => {
            fixtureDate.isNew = true;
            return builder;
        },
    };

    return builder;
}

export interface INoteBuilder extends IBuilder<FixtureDateNoteDto> {
    note(text: string): INoteBuilder;
    season(seasonOrId: any): INoteBuilder;
    division(divisionOrId: any): INoteBuilder;
    updated(date: string): INoteBuilder;
    noId(): INoteBuilder;
}

export function noteBuilder(date?: string, id?: string): INoteBuilder {
    const note: FixtureDateNoteDto = {
        id: id || createTemporaryId(),
        date: date || '',
        note: '',
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
            note.id = '';
            return builder;
        },
    };

    return builder;
}

export interface IDivisionBuilder extends IAddableBuilder<DivisionDto> {
    superleague(): IDivisionBuilder;
    updated(updated: string): IDivisionBuilder;
}

export function divisionBuilder(name: string, id?: string): IDivisionBuilder {
    const division: DivisionDto = {
        id: id || createTemporaryId(),
        name,
        superleague: false,
    };

    const builder: IDivisionBuilder = {
        build: () => division as DivisionDto,
        addTo: (map: any) => {
            map[division.id] = division;
            return builder;
        },
        updated(updated: string): IDivisionBuilder {
            division.updated = updated;
            return builder;
        },
        superleague(): IDivisionBuilder {
            division.superleague = true;
            return builder;
        }
    };

    return builder;
}

export interface IDivisionDataBuilder extends IAddableBuilder<DivisionDataDto & IDivisionDataContainerProps> {
    withFixtureDate(builder: BuilderParam<IDivisionFixtureDateBuilder>, date?: string): IDivisionDataBuilder;
    season(builder: BuilderParam<ISeasonBuilder>, name?: string, id?: string): IDivisionDataBuilder;
    name(name?: string): IDivisionDataBuilder;
    withTeam(teamOrBuilderFunc: any, name?: string, id?: string): IDivisionDataBuilder;
    withPlayer(playerOrBuilderFunc: any, name?: string, id?: string): IDivisionDataBuilder;
    superleague(): IDivisionDataBuilder;

    onReloadDivision(onReloadDivision: (preventReloadIfIdsAreTheSame?: boolean) => Promise<DivisionDataDto | null>): IDivisionDataBuilder;
    setDivisionData(setDivisionData: (value: (((prevState: DivisionDataDto) => DivisionDataDto) | DivisionDataDto)) => UntypedPromise): IDivisionDataBuilder;
    children(children: ReactNode): IDivisionDataBuilder;
    favouritesEnabled(enabled?: boolean): IDivisionDataBuilder;
}

export function divisionDataBuilder(divisionOrId?: any): IDivisionDataBuilder {
    const divisionId = divisionOrId && divisionOrId.id
        ? divisionOrId.id
        : divisionOrId || createTemporaryId();
    const divisionData: DivisionDataDto & IDivisionDataContainerProps = {
        id: divisionId || createTemporaryId(),
        name: divisionOrId && divisionOrId.name ? divisionOrId.name : null,
        fixtures: [],
        teams: [],
        dataErrors: [],
        players: [],
        setDivisionData: noop,
        onReloadDivision: noop,
        children: null,
        superleague: divisionOrId && divisionOrId.superleague,
    };

    const builder: IDivisionDataBuilder = {
        build: () => divisionData,
        addTo: (map: any) => {
            map[divisionData.id || ''] = divisionData;
            return builder;
        },
        withFixtureDate: (b: BuilderParam<IDivisionFixtureDateBuilder>, date?: string) => {
            const fixtureDate = b(fixtureDateBuilder(date)).build();
            divisionData.fixtures?.push(fixtureDate);
            return builder;
        },
        season: (b: BuilderParam<ISeasonBuilder>, name?: string, id?: string) => {
            divisionData.season = b(seasonBuilder(name, id)).build();
            return builder;
        },
        name: (name?: string) => {
            divisionData.name = name || '';
            return builder;
        },
        withTeam: (teamOrBuilderFunc: any, name?: string, id?: string) => {
            const team = teamOrBuilderFunc instanceof Function
                ? teamOrBuilderFunc(teamBuilder(name, id))
                : teamOrBuilderFunc;
            divisionData.teams?.push(team.build ? team.build() : team);
            return builder;
        },
        withPlayer: (playerOrBuilderFunc: any, name?: string, id?: string) => {
            const player = playerOrBuilderFunc instanceof Function
                ? playerOrBuilderFunc(playerBuilder(name, id))
                : playerOrBuilderFunc;
            divisionData.players?.push(player.build ? player.build() : player);
            return builder;
        },
        onReloadDivision: (onReloadDivision: (preventReloadIfIdsAreTheSame?: boolean) => Promise<DivisionDataDto | null>) => {
            divisionData.onReloadDivision = onReloadDivision;
            return builder;
        },
        setDivisionData: (setDivisionData: (data: DivisionDataDto) => UntypedPromise) => {
            divisionData.setDivisionData = setDivisionData;
            return builder;
        },
        children: (children: ReactNode) => {
            divisionData.children = children;
            return builder;
        },
        favouritesEnabled: (enabled?: boolean) => {
            divisionData.favouritesEnabled = enabled;
            return builder;
        },
        superleague: () => {
            divisionData.superleague = true;
            return builder;
        },
    };

    return builder;
}