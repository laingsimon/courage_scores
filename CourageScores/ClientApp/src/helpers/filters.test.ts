﻿import {
    getDateFilter,
    getFixtureDateFilters,
    getFixtureFilters,
    getNotesFilter,
    getTeamFilter,
    getTypeFilter, IFixtureMapping, IInitialisedFilters,
    getFilter, IRenderContext,
    isLastFixtureBeforeToday,
    isNextFixtureAfterToday,
    optionallyInvertFilter
} from "./filters";
import {IFilter} from "../components/division_fixtures/IFilter";
import {divisionFixtureBuilder, fixtureDateBuilder, noteBuilder} from "./builders/divisions";
import {ITournamentSideBuilder, tournamentBuilder} from "./builders/tournaments";
import {teamBuilder} from "./builders/teams";
import {DivisionFixtureDateDto} from "../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {Filter, NullFilter} from "../components/division_fixtures/Filter";
import {IEditableDivisionFixtureDateDto} from "../components/division_fixtures/IEditableDivisionFixtureDateDto";
import {fixtureBuilder} from "./builders/games";

describe('filters', () => {
    const today = date(0);
    const future = date(1);
    const past = date(-1);
    const lastWeekDate = new Date();
    lastWeekDate.setDate(new Date().getDate() - 7);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(new Date().getDate() - 1);
    const tomorrowDate = new Date();
    tomorrowDate.setDate(new Date().getDate() + 1);
    const nextWeekDate = new Date();
    nextWeekDate.setDate(new Date().getDate() + 7);

    function date(monthOffset: number) {
        let date = new Date();
        date.setMonth(date.getMonth() + monthOffset);
        return date.toISOString();
    }

    describe('isLastFixtureBeforeToday', () => {
        it('returns true if date is same as lastFixtureDateBeforeToday', () => {
            const context: IRenderContext = {
                lastFixtureDateBeforeToday: past
            };
            const fixtureDates: any[] = [];

            const result: boolean = isLastFixtureBeforeToday(context, fixtureDates, past);

            expect(result).toEqual(true);
        });

        it('returns false if date is not same as lastFixtureDateBeforeToday', () => {
            const context: IRenderContext = {
                lastFixtureDateBeforeToday: today
            };
            const fixtureDates: any[] = [];

            const result: boolean = isLastFixtureBeforeToday(context, fixtureDates, past);

            expect(result).toEqual(false);
        });

        it('sets lastFixtureDateBeforeToday if any fixture dates in past', () => {
            const context: IRenderContext = {};
            const fixtureDates = [fixtureDateBuilder(past).build()];

            const result: boolean = isLastFixtureBeforeToday(context, fixtureDates, past);

            expect(context).toEqual({
                lastFixtureDateBeforeToday: past
            });
            expect(result).toEqual(true);
        });

        it('does not set lastFixtureDateBeforeToday if no fixture dates', () => {
            const context: IRenderContext = {};
            const fixtureDates: any[] = [];

            const result: boolean = isLastFixtureBeforeToday(context, fixtureDates, past);

            expect(context).toEqual({
                lastFixtureDateBeforeToday: 'no fixtures in past'
            });
            expect(result).toEqual(false);
        });
    });

    describe('isNextFixtureAfterToday', () => {
        it('is today then returns false', () => {
            const context: IRenderContext = {};

            const result: boolean = isNextFixtureAfterToday(context, today);

            expect(result).toEqual(false);
        });

        it('is in past then returns false', () => {
            const context: IRenderContext = {};

            const result: boolean = isNextFixtureAfterToday(context, past);

            expect(result).toEqual(false);
        });

        it('is in future and future date not shown then returns true', () => {
            const context: IRenderContext = {};

            const result: boolean = isNextFixtureAfterToday(context, future);

            expect(context.futureDateShown).toEqual(future);
            expect(result).toEqual(true);
        });

        it('is in future and future date is same as date then returns true', () => {
            const context: IRenderContext = {
                futureDateShown: future,
            };

            const result: boolean = isNextFixtureAfterToday(context, future);

            expect(result).toEqual(true);
        });

        it('is in future and future date is not same as date then returns false', () => {
            const context: IRenderContext = {
                futureDateShown: future
            };

            const result: boolean = isNextFixtureAfterToday(context, date(2));

            expect(result).toEqual(false);
        });
    });

    describe('optionallyInvertFilter', () => {
        it('returns filter if empty', () => {
            const context: IRenderContext = {futureDateShown: '1'};
            const fixtures: DivisionFixtureDateDto[] = [{ date: '2' }];
            const stubFilter = new NullFilter<string>();
            let call: {filter: string, context: IRenderContext, fixtures: DivisionFixtureDateDto[]};
            const getFilter = (filter: string, context: IRenderContext, fixtures: DivisionFixtureDateDto[]) => {
                call = {filter, context, fixtures};
                return stubFilter;
            };

            const result: IFilter<string> = optionallyInvertFilter(getFilter, '', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result).toEqual(stubFilter);
        });

        it('returns filter if it does not start with not(', () => {
            const context: IRenderContext = {futureDateShown: '1'};
            const fixtures: DivisionFixtureDateDto[] = [{ date: '2' }];
            const stubFilter = new NullFilter<string>();
            let call: {filter: string, context: IRenderContext, fixtures: DivisionFixtureDateDto[]};
            const getFilter = (filter: string, context: IRenderContext, fixtures: DivisionFixtureDateDto[]) => {
                call = {filter, context, fixtures};
                return stubFilter;
            };

            const result: IFilter<string> = optionallyInvertFilter(getFilter, 'a=b', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result).toEqual(stubFilter);
        });

        it('returns null filter if no filter created and filter start with not(', () => {
            const context: IRenderContext = {futureDateShown: '1'};
            const fixtures: DivisionFixtureDateDto[] = [{ date: '2' }];
            let call: {filter: string, context: IRenderContext, fixtures: DivisionFixtureDateDto[]};
            const getFilter = (filter: string, context: IRenderContext, fixtures: DivisionFixtureDateDto[]) => {
                call = {filter, context, fixtures};
                return null;
            };

            const result: IFilter<string> = optionallyInvertFilter(getFilter, 'not(a=b)', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result.apply('')).toEqual(true);
        });

        it('returns inverted filter if filter created and filter start with not(', () => {
            const context: IRenderContext = {futureDateShown: '1'};
            const fixtures: DivisionFixtureDateDto[] = [{ date: '2' }];
            const stubFilter = new Filter<string>(_ => true);
            let call: {filter: string, context: IRenderContext, fixtures: DivisionFixtureDateDto[]};
            const getFilter = (filter: string, context: IRenderContext, fixtures: DivisionFixtureDateDto[]) => {
                call = {filter, context, fixtures};
                return stubFilter;
            };

            const result: IFilter<string> = optionallyInvertFilter(getFilter, 'not(a=b)', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result.apply('')).toEqual(false);
        });
    });

    describe('getDateFilter', () => {
        it('when past', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('past', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: past})).toEqual(true);
            expect(filter.apply({date: today})).toEqual(false);
            expect(filter.apply({date: future})).toEqual(false);
        });

        it('when future', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('future', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: past})).toEqual(false);
            expect(filter.apply({date: today})).toEqual(false);
            expect(filter.apply({date: future})).toEqual(true);
        });

        it('when last+next', () => {
            const context: IRenderContext = {
                lastFixtureDateBeforeToday: past,
                futureDateShown: future,
            };
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('last+next', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: date(-2)})).toEqual(false);
            expect(filter.apply({date: past})).toEqual(true);
            expect(filter.apply({date: today})).toEqual(true);
            expect(filter.apply({date: future})).toEqual(true);
            expect(filter.apply({date: date(2)})).toEqual(false);
        });

        it('when last-week', () => {
            const context: IRenderContext = {
                lastFixtureDateBeforeToday: past,
                futureDateShown: future,
            };
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('last-week', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: date(-2)})).toEqual(false);
            expect(filter.apply({date: past})).toEqual(false);
            expect(filter.apply({date: lastWeekDate.toISOString()})).toEqual(true);
            expect(filter.apply({date: today})).toEqual(false);
            expect(filter.apply({date: nextWeekDate.toISOString()})).toEqual(false);
            expect(filter.apply({date: future})).toEqual(false);
            expect(filter.apply({date: date(2)})).toEqual(false);
        });

        it('when yesterday', () => {
            const context: IRenderContext = {
                lastFixtureDateBeforeToday: past,
                futureDateShown: future,
            };
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('yesterday', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: date(-2)})).toEqual(false);
            expect(filter.apply({date: past})).toEqual(false);
            expect(filter.apply({date: yesterdayDate.toISOString()})).toEqual(true);
            expect(filter.apply({date: today})).toEqual(false);
            expect(filter.apply({date: tomorrowDate.toISOString()})).toEqual(false);
            expect(filter.apply({date: future})).toEqual(false);
            expect(filter.apply({date: date(2)})).toEqual(false);
        });

        it('when today', () => {
            const context: IRenderContext = {
                lastFixtureDateBeforeToday: past,
                futureDateShown: future,
            };
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('today', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: date(-2)})).toEqual(false);
            expect(filter.apply({date: past})).toEqual(false);
            expect(filter.apply({date: yesterdayDate.toISOString()})).toEqual(false);
            expect(filter.apply({date: today})).toEqual(true);
            expect(filter.apply({date: tomorrowDate.toISOString()})).toEqual(false);
            expect(filter.apply({date: future})).toEqual(false);
            expect(filter.apply({date: date(2)})).toEqual(false);
        });

        it('when tomorrow', () => {
            const context: IRenderContext = {
                lastFixtureDateBeforeToday: past,
                futureDateShown: future,
            };
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('tomorrow', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: date(-2)})).toEqual(false);
            expect(filter.apply({date: past})).toEqual(false);
            expect(filter.apply({date: yesterdayDate.toISOString()})).toEqual(false);
            expect(filter.apply({date: today})).toEqual(false);
            expect(filter.apply({date: tomorrowDate.toISOString()})).toEqual(true);
            expect(filter.apply({date: future})).toEqual(false);
            expect(filter.apply({date: date(2)})).toEqual(false);
        });

        it('when next-week', () => {
            const context: IRenderContext = {
                lastFixtureDateBeforeToday: past,
                futureDateShown: future,
            };
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('next-week', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: date(-2)})).toEqual(false);
            expect(filter.apply({date: past})).toEqual(false);
            expect(filter.apply({date: lastWeekDate.toISOString()})).toEqual(false);
            expect(filter.apply({date: today})).toEqual(false);
            expect(filter.apply({date: nextWeekDate.toISOString()})).toEqual(true);
            expect(filter.apply({date: future})).toEqual(false);
            expect(filter.apply({date: date(2)})).toEqual(false);
        });

        it('when matches date yyyy-MM format', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('2023-02', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: '2023-02-01T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-02-02T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-03-03T00:00:00'})).toEqual(false);
        });

        it('when matches date yyyy-MM,yyyy-MM format', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('2023-02,2023-03', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: '2023-01-01T00:00:00'})).toEqual(false);
            expect(filter.apply({date: '2023-02-01T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-02-02T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-03-03T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-04-04T00:00:00'})).toEqual(false);
        });

        it('when matches date yyyy-MM-dd format', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('2023-02-01', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: '2023-02-01T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-02-02T00:00:00'})).toEqual(false);
            expect(filter.apply({date: '2023-03-03T00:00:00'})).toEqual(false);
        });

        it('when matches date yyyy-MM-dd,yyyy-MM-dd format', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('2023-02-01,2023-03-03', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: '2023-02-01T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-02-02T00:00:00'})).toEqual(false);
            expect(filter.apply({date: '2023-03-03T00:00:00'})).toEqual(true);
        });

        it('otherwise returns null filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('foo', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });
    });

    describe('getTypeFilter', () => {
        it('when league', () => {
            const filter: IFilter<IFixtureMapping> = getTypeFilter('league');

            expect(filter.apply({
                tournamentFixture: null,
                fixture: divisionFixtureBuilder().build(),
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: null,
            })).toEqual(false);
            expect(filter.apply({
                tournamentFixture: tournamentBuilder().build(),
            })).toEqual(false);
            expect(filter.apply({
                tournamentFixture: null,
            })).toEqual(false);
        });

        it('when qualifier', () => {
            const filter: IFilter<IFixtureMapping> = getTypeFilter('qualifier');

            expect(filter.apply({
                fixture: divisionFixtureBuilder().knockout().build(),
            })).toEqual(true);
            expect(filter.apply({
            })).toEqual(false);
            expect(filter.apply({
                fixture: divisionFixtureBuilder().build(),
            })).toEqual(false);
        });

        it('when tournament', () => {
            const filter: IFilter<IFixtureMapping> = getTypeFilter('tournament');

            expect(filter.apply({
                tournamentFixture: tournamentBuilder().build(),
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: tournamentBuilder().proposed().build(),
            })).toEqual(false);
            expect(filter.apply({
                tournamentFixture: tournamentBuilder().proposed().build(),
            })).toEqual(false);
        });

        it('otherwise', () => {
            const filter: IFilter<IFixtureMapping> = getTypeFilter('foo');

            expect(filter).not.toBeNull();
        });
    });

    describe('getTeamFilter', () => {
        it('when empty', () => {
            const filter: IFilter<IFixtureMapping> = getTeamFilter('');

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });

        it('when id provided', () => {
            const filter: IFilter<IFixtureMapping> = getTeamFilter('abcd');

            expect(filter).not.toBeNull();
            expect(filter.apply({
                fixture: divisionFixtureBuilder()
                    .bye('HOME', 'abcd')
                    .build(),
            })).toEqual(true);
            expect(filter.apply({
                fixture: divisionFixtureBuilder()
                    .playing('HOME', teamBuilder('AWAY', 'abcd').build())
                    .build(),
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: tournamentBuilder().withSide((s: ITournamentSideBuilder) => s.teamId('abcd')).build(),
            })).toEqual(true);
        });

        it('when name provided', () => {
            const filter: IFilter<IFixtureMapping> = getTeamFilter('name');

            expect(filter).not.toBeNull();
            expect(filter.apply({
                fixture: divisionFixtureBuilder()
                    .bye('name', 'abcd')
                    .build(),
            })).toEqual(true);
            expect(filter.apply({
                fixture: divisionFixtureBuilder()
                    .playing('HOME', teamBuilder('name', 'abcd').build())
                    .build(),
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: tournamentBuilder().withSide((s: ITournamentSideBuilder) => s.name('name').teamId('abcd')).build(),
            })).toEqual(true);
        });

        it('when name provided ignores case', () => {
            const filter: IFilter<IFixtureMapping> = getTeamFilter('NAME');

            expect(filter).not.toBeNull();
            expect(filter.apply({
                fixture: divisionFixtureBuilder()
                    .bye('name', 'abcd')
                    .build(),
            })).toEqual(true);
            expect(filter.apply({
                fixture: divisionFixtureBuilder()
                    .playing('HOME', teamBuilder('name', 'abcd').build())
                    .build(),
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: tournamentBuilder().withSide((s: ITournamentSideBuilder) => s.name('name').teamId('abcd')).build(),
            })).toEqual(true);
        });
    });

    describe('getNotesFilter', () => {
        it('filters out dates with no fixtures and no tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('only-with-fixtures');

            expect(filter.apply({
                notes: [noteBuilder().build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });

        it('keeps dates with notes and no fixtures or tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('');

            expect(filter.apply({
                notes: [noteBuilder().build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with single note matching filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('abc');

            expect(filter.apply({
                notes: [noteBuilder().note('abcd').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note matching any filter criteria', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('abc;efg');

            expect(filter.apply({
                notes: [noteBuilder().note('another note').build(), noteBuilder().note('efgh').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note matching filter ignoring case', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('abc;efg');

            expect(filter.apply({
                notes: [noteBuilder().note('EFGH').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note containing filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('cdef');

            expect(filter.apply({
                notes: [noteBuilder().note('abcdef').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note containing filter ignoring case', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('CDEF');

            expect(filter.apply({
                notes: [noteBuilder().note('abcdef').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note matching regex filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('^singles');

            expect(filter.apply({
                notes: [noteBuilder().note('singles').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note matching regex filter ignoring case', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('^singles');

            expect(filter.apply({
                notes: [noteBuilder().note('singles').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('excludes dates where note does not match regex filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('^singles');

            expect(filter.apply({
                notes: [noteBuilder().note('divisional singles').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });

        it('ignores dates without any note matching filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('abc;efg');

            expect(filter.apply({
                notes: [noteBuilder().note('ijkl').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });
    });

    describe('getFixtureFilters', () => {
        it('returns positive filter when expression is empty', () => {
            const filter: IFilter<IFixtureMapping> = getFixtureFilters('');

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });

        it('returns filter when expression is not empty', () => {
            const filter: IFilter<IFixtureMapping> = getFixtureFilters({type: 'league'});

            expect(filter).not.toBeNull();
        });
    });

    describe('getFixtureDateFilters', () => {
        it('returns negative when no notes, fixtures or tournaments and not new', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });

        it('returns positive when no notes, fixtures or tournaments and new', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [],
                fixtures: [],
                tournamentFixtures: [],
                isNew: true,
            })).toEqual(true);
        });

        it('returns positive when notes but no fixtures or tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [noteBuilder().build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('returns positive when no notes but has fixtures and tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [],
                fixtures: [fixtureBuilder().playing('HOME').build()],
                tournamentFixtures: [tournamentBuilder().build()],
            })).toEqual(true);
        });

        it('returns negative when notes but no fixtures or tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({notes: 'only-with-fixtures'}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [noteBuilder().build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });

        it('returns filter for dates', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({date: 'past'}, {}, []);

            expect(filter).not.toBeNull();
        });
    });

    describe('initFilter', () => {
        it('inits date filter', () => {
            const filter: IInitialisedFilters = getFilter({search: '?date=past'});

            expect(filter).toEqual({date: 'past'});
        });

        it('inits type filter', () => {
            const filter: IInitialisedFilters = getFilter({search: '?type=league'});

            expect(filter).toEqual({type: 'league'});
        });

        it('inits team filter', () => {
            const filter: IInitialisedFilters = getFilter({search: '?team=abcd'});

            expect(filter).toEqual({team: 'abcd'});
        });

        it('inits notes filter', () => {
            const filter: IInitialisedFilters = getFilter({search: '?notes=abcd'});

            expect(filter).toEqual({notes: 'abcd'});
        });

        it('accepts no filter expressions', () => {
            expect(getFilter({search: '?'})).toEqual({});
            expect(getFilter({search: ''})).toEqual({});
        });

        it('inits multiple filters', () => {
            const filter: IInitialisedFilters = getFilter({search: '?team=abcd&date=past&type=league'});

            expect(filter).toEqual({team: 'abcd', date: 'past', type: 'league'});
        });
    });
});