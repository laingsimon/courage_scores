import { all, any } from '../../helpers/collections';
import { AndFilter, Filter, NotFilter, NullFilter, OrFilter } from './Filter';
import {
    isInFuture,
    isInPast,
    isDateEqualTo,
    isToday,
} from '../../helpers/dates';
import { IFilter } from './IFilter';
import { DivisionTournamentFixtureDetailsDto } from '../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto';
import { DivisionFixtureDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDto';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';
import { FixtureDateNoteDto } from '../../interfaces/models/dtos/FixtureDateNoteDto';
import { IEditableDivisionFixtureDateDto } from './IEditableDivisionFixtureDateDto';
import { TournamentSideDto } from '../../interfaces/models/dtos/Game/TournamentSideDto';

export interface IRenderContext {
    lastFixtureDateBeforeToday?: string;
    futureDateShown?: string;
}

export interface IFixtureMapping {
    date?: string;
    fixture?: DivisionFixtureDto;
    tournamentFixture?: DivisionTournamentFixtureDetailsDto;
}

export function isLastFixtureBeforeToday(
    renderContext: IRenderContext,
    fixtures: { date: string }[],
    date: string,
): boolean {
    if (!renderContext.lastFixtureDateBeforeToday) {
        const dates = fixtures.map((f) => f.date).filter(isInPast);
        // Assumes all dates are sorted
        if (any(dates)) {
            renderContext.lastFixtureDateBeforeToday = dates[dates.length - 1];
        } else {
            renderContext.lastFixtureDateBeforeToday = 'no fixtures in past';
        }
    }

    return date === renderContext.lastFixtureDateBeforeToday;
}

export function isNextFixtureAfterToday(
    renderContext: IRenderContext,
    date: string,
): boolean {
    if (isInFuture(date)) {
        if (!renderContext.futureDateShown) {
            renderContext.futureDateShown = date;
        }

        return renderContext.futureDateShown === date;
    }

    return false;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function optionallyInvertFilter<T>(
    getFilter: (
        constraint: string | undefined,
        context: IRenderContext,
        fixtures: any,
    ) => IFilter<T>,
    filterInput?: string,
    renderContext?: any,
    fixtures?: DivisionFixtureDateDto[],
): IFilter<T> {
    if (filterInput && filterInput.indexOf('not(') === 0) {
        const withoutNot: string = filterInput.substring(
            4,
            filterInput.length - 1,
        );
        const positiveFilter: IFilter<T> = getFilter(
            withoutNot,
            renderContext,
            fixtures,
        );
        return positiveFilter
            ? new NotFilter<T>(positiveFilter)
            : new NullFilter<T>();
    }

    return (
        getFilter(filterInput, renderContext, fixtures) ?? new NullFilter<T>()
    );
}

export function getDateFilter(
    date: string | undefined,
    renderContext: IRenderContext,
    fixtures: DivisionFixtureDateDto[],
): IFilter<IEditableDivisionFixtureDateDto> {
    switch (date) {
        case 'past':
            return new Filter<IEditableDivisionFixtureDateDto>(
                (c: DivisionFixtureDateDto) => isInPast(c.date),
            );
        case 'future':
            return new Filter<IEditableDivisionFixtureDateDto>(
                (c: DivisionFixtureDateDto) => isInFuture(c.date),
            );
        case 'last+next':
            return new OrFilter<IEditableDivisionFixtureDateDto>([
                new Filter<IEditableDivisionFixtureDateDto>(
                    (c: DivisionFixtureDateDto) => isToday(c.date),
                ),
                new Filter<IEditableDivisionFixtureDateDto>(
                    (c: DivisionFixtureDateDto) =>
                        isLastFixtureBeforeToday(
                            renderContext,
                            fixtures,
                            c.date,
                        ),
                ),
                new Filter<IEditableDivisionFixtureDateDto>(
                    (c: DivisionFixtureDateDto) =>
                        isNextFixtureAfterToday(renderContext, c.date),
                ),
            ]);
        case 'today':
            return new Filter<IEditableDivisionFixtureDateDto>(
                (c: IEditableDivisionFixtureDateDto) => isToday(c.date),
            );
        case 'yesterday':
            return new Filter<IEditableDivisionFixtureDateDto>(
                (c: IEditableDivisionFixtureDateDto) =>
                    isDateEqualTo(c.date, -1),
            );
        case 'tomorrow':
            return new Filter<IEditableDivisionFixtureDateDto>(
                (c: IEditableDivisionFixtureDateDto) =>
                    isDateEqualTo(c.date, 1),
            );
        case 'last-week':
            return new Filter<IEditableDivisionFixtureDateDto>(
                (c: IEditableDivisionFixtureDateDto) =>
                    isDateEqualTo(c.date, -7),
            );
        case 'next-week':
            return new Filter<IEditableDivisionFixtureDateDto>(
                (c: IEditableDivisionFixtureDateDto) =>
                    isDateEqualTo(c.date, 7),
            );
        default:
            if (
                date &&
                all(date.split(','), (d: string) => !!d.match(/\d{4}-\d{2}/))
            ) {
                const splitDates: string[] = date.split(',');
                return new Filter<IEditableDivisionFixtureDateDto>(
                    (c: DivisionFixtureDateDto) =>
                        any(
                            splitDates,
                            (date: string) => c.date.indexOf(date) === 0,
                        ),
                );
            }

            return new NullFilter<IEditableDivisionFixtureDateDto>();
    }
}

export function getTypeFilter(type?: string): IFilter<IFixtureMapping> {
    switch (type) {
        case 'league':
            return new AndFilter<IFixtureMapping>([
                new Filter<IFixtureMapping>((c) => !c.tournamentFixture),
                new Filter<IFixtureMapping>(
                    (c) => (c.fixture && !c.fixture?.isKnockout) || false,
                ),
            ]);
        case 'qualifier':
            return new Filter<IFixtureMapping>(
                (c) => c.fixture?.isKnockout === true,
            );
        case 'tournament':
            return new Filter<IFixtureMapping>((c) => !!c.tournamentFixture);
        default:
            return new NullFilter<IFixtureMapping>();
    }
}

export function getTeamFilter(name?: string): IFilter<IFixtureMapping> {
    if (!name) {
        return new NullFilter<IFixtureMapping>();
    }

    return new OrFilter<IFixtureMapping>([
        new Filter<IFixtureMapping>(
            (c: IFixtureMapping) =>
                (c.fixture &&
                    c.fixture.homeTeam &&
                    (c.fixture.homeTeam.id === name ||
                        c.fixture.homeTeam.name.toLowerCase() ===
                            name.toLowerCase())) ||
                false,
        ),
        new Filter<IFixtureMapping>(
            (c: IFixtureMapping) =>
                (c.fixture &&
                    c.fixture.awayTeam &&
                    (c.fixture.awayTeam!.id === name ||
                        c.fixture.awayTeam!.name.toLowerCase() ===
                            name.toLowerCase())) ||
                false,
        ),
        new Filter<IFixtureMapping>(
            (c: IFixtureMapping) =>
                (c.tournamentFixture &&
                    any(
                        c.tournamentFixture!.sides!,
                        (s: TournamentSideDto) =>
                            s.teamId === name ||
                            s.name!.toLowerCase() === name.toLowerCase(),
                    )) ||
                false,
        ),
    ]);
}

export function getNotesFilter(
    notesFilter?: string,
): IFilter<IEditableDivisionFixtureDateDto> {
    if (!notesFilter) {
        return new NullFilter<IEditableDivisionFixtureDateDto>();
    }

    switch (notesFilter) {
        case 'only-with-fixtures':
            return new Filter<IEditableDivisionFixtureDateDto>(
                (fd: DivisionFixtureDateDto) =>
                    any(fd.fixtures || []) || any(fd.tournamentFixtures || []),
            );
        default: {
            const filters: string[] = notesFilter
                .split(';')
                .map((f) => f.toLowerCase());
            return new OrFilter<IEditableDivisionFixtureDateDto>(
                filters.map(
                    (filter: string) =>
                        new Filter<IEditableDivisionFixtureDateDto>(
                            (fd: DivisionFixtureDateDto) =>
                                any(
                                    fd.notes?.map(
                                        (noteDto: FixtureDateNoteDto) =>
                                            noteDto.note.toLowerCase(),
                                    ) || [],
                                    (note: string) => !!note.match(filter),
                                ),
                        ),
                ),
            );
        }
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getFixtureFilters(filter: any): IFilter<IFixtureMapping> {
    return new AndFilter<IFixtureMapping>([
        optionallyInvertFilter<IFixtureMapping>(getTypeFilter, filter.type),
        optionallyInvertFilter<IFixtureMapping>(getTeamFilter, filter.team),
    ]);
}

export function getFixtureDateFilters(
    filter: { date?: string; notes?: string },
    renderContext: IRenderContext,
    fixtures?: DivisionFixtureDateDto[],
): IFilter<IEditableDivisionFixtureDateDto> {
    return new AndFilter<IEditableDivisionFixtureDateDto>([
        new Filter<IEditableDivisionFixtureDateDto>(
            (fd: IEditableDivisionFixtureDateDto) =>
                any(fd.fixtures || []) ||
                any(fd.tournamentFixtures || []) ||
                any(fd.notes || []) ||
                fd.isNew === true,
        ),
        optionallyInvertFilter<IEditableDivisionFixtureDateDto>(
            getDateFilter,
            filter.date,
            renderContext,
            fixtures || [],
        ),
        optionallyInvertFilter<IEditableDivisionFixtureDateDto>(
            getNotesFilter,
            filter.notes,
        ),
    ]);
}

export interface IInitialisedFilters
    extends Record<string, string | undefined> {
    date?: string;
    type?: string;
    team?: string;
    notes?: string;
}

export function getFilter(location: { search: string }): IInitialisedFilters {
    const search = new URLSearchParams(location.search);
    const filter: IInitialisedFilters = {};
    if (search.has('date')) {
        filter.date = search.get('date') || undefined;
    }
    if (search.has('type')) {
        filter.type = search.get('type') || undefined;
    }
    if (search.has('team')) {
        filter.team = search.get('team') || undefined;
    }
    if (search.has('notes')) {
        filter.notes = search.get('notes') || undefined;
    }

    return filter;
}
