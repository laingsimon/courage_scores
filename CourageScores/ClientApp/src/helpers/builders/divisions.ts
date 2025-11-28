/* istanbul ignore file */

import { BuilderParam, IAddableBuilder, IBuilder } from './builders';
import { IDatedDivisionFixtureDto } from '../../components/division_fixtures/IDatedDivisionFixtureDto';
import { IEditableDivisionFixtureDto } from '../../components/division_fixtures/DivisionFixture';
import { createTemporaryId } from '../projection';
import { OtherDivisionFixtureDto } from '../../interfaces/models/dtos/Division/OtherDivisionFixtureDto';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';
import { IEditableDivisionFixtureDateDto } from '../../components/division_fixtures/IEditableDivisionFixtureDateDto';
import { FixtureDateNoteDto } from '../../interfaces/models/dtos/FixtureDateNoteDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { ISeasonBuilder, seasonBuilder } from './seasons';
import { IDivisionDataContainerProps } from '../../components/league/DivisionDataContainer';
import { ITournamentBuilder, tournamentBuilder } from './tournaments';
import { ReactNode } from 'react';
import { UntypedPromise } from '../../interfaces/UntypedPromise';
import { noop } from '../tests';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { DivisionPlayerDto } from '../../interfaces/models/dtos/Division/DivisionPlayerDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { GameTeamDto } from '../../interfaces/models/dtos/Game/GameTeamDto';

export interface IDivisionFixtureBuilder extends IAddableBuilder<IDatedDivisionFixtureDto> {
    withOtherFixtureUsingUsingAddress(
        name: string,
        id?: string,
        awayName?: string,
    ): IDivisionFixtureBuilder;
    playing(home: GameTeamDto, away: GameTeamDto): IDivisionFixtureBuilder;
    scores(home?: number, away?: number): IDivisionFixtureBuilder;
    bye(team: TeamDto): IDivisionFixtureBuilder;
    knockout(): IDivisionFixtureBuilder;
    postponed(): IDivisionFixtureBuilder;
    originalAwayTeamId(id: string): IDivisionFixtureBuilder;
    accoladesCount(): IDivisionFixtureBuilder;
    proposal(): IDivisionFixtureBuilder;
}

export function divisionFixtureBuilder(
    date?: string,
    id?: string,
): IDivisionFixtureBuilder {
    const fixture: IDatedDivisionFixtureDto & IEditableDivisionFixtureDto = {
        id: id || createTemporaryId(),
        date: date || '',
        fixturesUsingAddress: [],
        homeTeam: { name: '' },
    };

    const builder: IDivisionFixtureBuilder = {
        build: () => fixture,
        addTo: (map: { [key: string]: IDatedDivisionFixtureDto }) => {
            map[fixture.id || ''] = fixture;
            return builder;
        },
        withOtherFixtureUsingUsingAddress: (
            name: string,
            id?: string,
            awayName?: string,
        ) => {
            const otherFixture: OtherDivisionFixtureDto = {
                id: id || createTemporaryId(),
                divisionId: createTemporaryId(),
                home: {
                    id: createTemporaryId(),
                    name: name,
                },
                away: {
                    id: createTemporaryId(),
                    name: awayName || 'AWAY',
                },
            };

            fixture.fixturesUsingAddress?.push(otherFixture);
            return builder;
        },
        playing: (home: GameTeamDto, away: GameTeamDto) => {
            fixture.homeTeam = home;
            fixture.awayTeam = away;
            return builder;
        },
        scores: (home: number, away: number) => {
            fixture.homeScore = home;
            fixture.awayScore = away;
            return builder;
        },
        bye: (team: TeamDto) => {
            fixture.homeTeam = team;
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
        },
    };

    return builder;
}

export interface IDivisionFixtureDateBuilder extends IBuilder<
    DivisionFixtureDateDto & IEditableDivisionFixtureDateDto
> {
    knockout(): IDivisionFixtureDateBuilder;
    withFixture(
        builder?: BuilderParam<IDivisionFixtureBuilder>,
        id?: string,
    ): IDivisionFixtureDateBuilder;
    withTournament(
        builder?: BuilderParam<ITournamentBuilder>,
        id?: string,
    ): IDivisionFixtureDateBuilder;
    withNote(
        builder?: BuilderParam<INoteBuilder>,
        id?: string,
    ): IDivisionFixtureDateBuilder;
    isNew(): IDivisionFixtureDateBuilder;
}

export function fixtureDateBuilder(date?: string): IDivisionFixtureDateBuilder {
    const fixtureDate: DivisionFixtureDateDto &
        IEditableDivisionFixtureDateDto = {
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
        withFixture: (
            b?: BuilderParam<IDivisionFixtureBuilder>,
            id?: string,
        ) => {
            const fixture = b
                ? b(divisionFixtureBuilder(date, id)).build()
                : divisionFixtureBuilder(date).build();
            fixtureDate.fixtures?.push(fixture);
            return builder;
        },
        withTournament: (b?: BuilderParam<ITournamentBuilder>, id?: string) => {
            const tournament = b
                ? b(tournamentBuilder(id).date(date || '')).build()
                : tournamentBuilder()
                      .date(date || '')
                      .build();
            fixtureDate.tournamentFixtures?.push(tournament);
            return builder;
        },
        withNote: (b: BuilderParam<INoteBuilder>, id?: string) => {
            const note = b
                ? b(noteBuilder(date, id)).build()
                : noteBuilder(date).build();
            fixtureDate.notes?.push(note);
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
    season(season: SeasonDto): INoteBuilder;
    division(division: DivisionDto): INoteBuilder;
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
        season: (season: SeasonDto) => {
            note.seasonId = season.id;
            return builder;
        },
        division: (division: DivisionDto) => {
            note.divisionId = division.id;
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
        addTo: (map: { [key: string]: DivisionDto }) => {
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
        },
    };

    return builder;
}

export interface IDivisionDataBuilder extends IAddableBuilder<
    DivisionDataDto & IDivisionDataContainerProps
> {
    withFixtureDate(
        builder?: BuilderParam<IDivisionFixtureDateBuilder>,
        date?: string,
    ): IDivisionDataBuilder;
    season(
        builder?: BuilderParam<ISeasonBuilder>,
        id?: string,
        name?: string,
    ): IDivisionDataBuilder;
    name(name?: string): IDivisionDataBuilder;
    withTeam(team: TeamDto): IDivisionDataBuilder;
    withPlayer(player: DivisionPlayerDto): IDivisionDataBuilder;
    superleague(): IDivisionDataBuilder;

    onReloadDivision(
        onReloadDivision: (
            preventReloadIfIdsAreTheSame?: boolean,
        ) => Promise<DivisionDataDto | null>,
    ): IDivisionDataBuilder;
    setDivisionData(
        setDivisionData: (
            value:
                | ((prevState: DivisionDataDto) => DivisionDataDto)
                | DivisionDataDto,
        ) => UntypedPromise,
    ): IDivisionDataBuilder;
    children(children: ReactNode): IDivisionDataBuilder;
    favouritesEnabled(enabled?: boolean): IDivisionDataBuilder;
}

export function divisionDataBuilder(
    division?: DivisionDto,
): IDivisionDataBuilder {
    const divisionId = division?.id || createTemporaryId();
    const divisionData: DivisionDataDto & IDivisionDataContainerProps = {
        id: divisionId || createTemporaryId(),
        name: division?.name ?? '',
        fixtures: [],
        teams: [],
        dataErrors: [],
        players: [],
        setDivisionData: noop,
        onReloadDivision: noop,
        children: null,
        superleague: division?.superleague,
    };

    const builder: IDivisionDataBuilder = {
        build: () => divisionData,
        addTo: (map: {
            [key: string]: DivisionDataDto & IDivisionDataContainerProps;
        }) => {
            map[divisionData.id || ''] = divisionData;
            return builder;
        },
        withFixtureDate: (
            b?: BuilderParam<IDivisionFixtureDateBuilder>,
            date?: string,
        ) => {
            const fixtureDate = b
                ? b(fixtureDateBuilder(date)).build()
                : fixtureDateBuilder(date).build();
            divisionData.fixtures?.push(fixtureDate);
            return builder;
        },
        season: (
            b?: BuilderParam<ISeasonBuilder>,
            id?: string,
            name?: string,
        ) => {
            divisionData.season = b
                ? b(seasonBuilder(name ?? 'SEASON', id)).build()
                : seasonBuilder().build();
            return builder;
        },
        name: (name?: string) => {
            divisionData.name = name || '';
            return builder;
        },
        withTeam: (team: TeamDto) => {
            divisionData.teams?.push(team);
            return builder;
        },
        withPlayer: (player: DivisionPlayerDto) => {
            divisionData.players?.push(player);
            return builder;
        },
        onReloadDivision: (
            onReloadDivision: (
                preventReloadIfIdsAreTheSame?: boolean,
            ) => Promise<DivisionDataDto | null>,
        ) => {
            divisionData.onReloadDivision = onReloadDivision;
            return builder;
        },
        setDivisionData: (
            setDivisionData: (data: DivisionDataDto) => UntypedPromise,
        ) => {
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
