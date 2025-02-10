import {
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
import {IFilter} from "./IFilter";
import {divisionFixtureBuilder, fixtureDateBuilder, noteBuilder} from "../../helpers/builders/divisions";
import {ITournamentSideBuilder, tournamentBuilder} from "../../helpers/builders/tournaments";
import {teamBuilder} from "../../helpers/builders/teams";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {Filter, NullFilter} from "./Filter";
import {IEditableDivisionFixtureDateDto} from "./IEditableDivisionFixtureDateDto";
import {fixtureBuilder} from "../../helpers/builders/games";
import {DivisionFixtureDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDto";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";

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
    const fixture: DivisionFixtureDto = fixtureBuilder().playing('HOME').build();
    const tournament: DivisionTournamentFixtureDetailsDto = tournamentBuilder().build();

    function date(monthOffset: number) {
        let date = new Date();
        date.setMonth(date.getMonth() + monthOffset);
        return date.toISOString();
    }

    function fixtureDate(note?: string, fixture?: DivisionFixtureDto, tournament?: DivisionTournamentFixtureDetailsDto, isNew?: boolean): IEditableDivisionFixtureDateDto {
        return {
            date: '',
            notes: note ? [noteBuilder().note(note).build()] : [],
            fixtures: fixture ? [fixture] : [],
            tournamentFixtures: tournament ? [tournament] : [],
            isNew,
        };
    }

    function fixtureMapping(fixture?: DivisionFixtureDto, tournamentFixture?: DivisionTournamentFixtureDetailsDto): IFixtureMapping {
        return {
            fixture,
            tournamentFixture
        }
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
        const emptyContext: IRenderContext = {};

        it('is today then returns false', () => {
            const result: boolean = isNextFixtureAfterToday(emptyContext, today);

            expect(result).toEqual(false);
        });

        it('is in past then returns false', () => {
            const result: boolean = isNextFixtureAfterToday(emptyContext, past);

            expect(result).toEqual(false);
        });

        it('is in future and future date not shown then returns true', () => {
            const result: boolean = isNextFixtureAfterToday(emptyContext, future);

            expect(emptyContext.futureDateShown).toEqual(future);
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
        const getFilter = (filter: string | undefined, context: IRenderContext, fixtures: DivisionFixtureDateDto[]) => {
            call = {filter, context, fixtures};
            return stubFilter!;
        };
        let call: {filter: string | undefined, context: IRenderContext, fixtures: DivisionFixtureDateDto[]} | null;
        let stubFilter: IFilter<string> | null;

        beforeEach(() => {
            call = null;
            stubFilter = new NullFilter<string>();
        })

        it('returns filter if empty', () => {
            const context: IRenderContext = {futureDateShown: '1'};
            const fixtures: DivisionFixtureDateDto[] = [{ date: '2' }];

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
            stubFilter = null;

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
            stubFilter = new Filter<string>(_ => true);

            const result: IFilter<string> = optionallyInvertFilter(getFilter, 'not(a=b)', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result.apply('')).toEqual(false);
        });
    });

    describe('getDateFilter', () => {
        const context: IRenderContext = {
            lastFixtureDateBeforeToday: past,
            futureDateShown: future,
        };

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
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getDateFilter('last+next', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: date(-2)})).toEqual(false);
            expect(filter.apply({date: past})).toEqual(true);
            expect(filter.apply({date: today})).toEqual(true);
            expect(filter.apply({date: future})).toEqual(true);
            expect(filter.apply({date: date(2)})).toEqual(false);
        });

        it('when last-week', () => {
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
            expect(filter.apply({
                date: ''
            })).toEqual(true);
        });
    });

    describe('getTypeFilter', () => {
        it('when league', () => {
            const filter: IFilter<IFixtureMapping> = getTypeFilter('league');

            expect(filter.apply(fixtureMapping(fixture))).toEqual(true);
            expect(filter.apply(fixtureMapping())).toEqual(false);
            expect(filter.apply(fixtureMapping(undefined, tournament))).toEqual(false);
        });

        it('when qualifier', () => {
            const filter: IFilter<IFixtureMapping> = getTypeFilter('qualifier');

            expect(filter.apply(fixtureMapping(divisionFixtureBuilder().knockout().build()))).toEqual(true);
            expect(filter.apply(fixtureMapping())).toEqual(false);
            expect(filter.apply(fixtureMapping(fixture))).toEqual(false);
        });

        it('when tournament', () => {
            const filter: IFilter<IFixtureMapping> = getTypeFilter('tournament');

            expect(filter.apply(fixtureMapping(undefined, tournament))).toEqual(true);
            expect(filter.apply(fixtureMapping(undefined, tournamentBuilder().proposed().build()))).toEqual(true);
        });

        it('otherwise', () => {
            const filter: IFilter<IFixtureMapping> = getTypeFilter('foo');

            expect(filter).not.toBeNull();
        });
    });

    describe('getTeamFilter', () => {
        const abcdTeam = teamBuilder('name', 'abcd').build();
        const tournamentWithAbcdTeamPlaying = tournamentBuilder().withSide((s: ITournamentSideBuilder) => s.name('name').teamId('abcd')).build();
        const byeAbcd = divisionFixtureBuilder().bye('name', 'abcd').build();
        const homeAbcd = divisionFixtureBuilder().playing('HOME', abcdTeam).build();

        it('when empty', () => {
            const filter: IFilter<IFixtureMapping> = getTeamFilter('');

            expect(filter.apply({})).toEqual(true);
        });

        it('when id provided', () => {
            const filter: IFilter<IFixtureMapping> = getTeamFilter('abcd');

            const awayAbcd = divisionFixtureBuilder().playing('HOME', teamBuilder('AWAY', 'abcd').build()).build();
            expect(filter.apply(fixtureMapping(byeAbcd))).toEqual(true);
            expect(filter.apply(fixtureMapping(awayAbcd))).toEqual(true);
            expect(filter.apply(fixtureMapping(undefined, tournamentWithAbcdTeamPlaying))).toEqual(true);
        });

        it('when name provided', () => {
            const filter: IFilter<IFixtureMapping> = getTeamFilter('name');

            expect(filter.apply(fixtureMapping(byeAbcd))).toEqual(true);
            expect(filter.apply(fixtureMapping(homeAbcd))).toEqual(true);
            expect(filter.apply(fixtureMapping(undefined, tournamentWithAbcdTeamPlaying))).toEqual(true);
        });

        it('when name provided ignores case', () => {
            const filter: IFilter<IFixtureMapping> = getTeamFilter('NAME');

            expect(filter.apply(fixtureMapping(byeAbcd))).toEqual(true);
            expect(filter.apply(fixtureMapping(homeAbcd))).toEqual(true);
            expect(filter.apply(fixtureMapping(undefined, tournamentWithAbcdTeamPlaying))).toEqual(true);
        });
    });

    describe('getNotesFilter', () => {
        it('filters out dates with no fixtures and no tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('only-with-fixtures');

            expect(filter.apply(fixtureDate('NOTE'))).toEqual(false);
        });

        it('keeps dates with notes and no fixtures or tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('');

            expect(filter.apply(fixtureDate('NOTE'))).toEqual(true);
        });

        it('keeps dates with single note matching filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('abc');

            expect(filter.apply(fixtureDate('abcd'))).toEqual(true);
        });

        it('keeps dates with any note matching any filter criteria', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('abc;efg');

            expect(filter.apply({
                date: '',
                notes: [noteBuilder().note('another note').build(), noteBuilder().note('efgh').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note matching filter ignoring case', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('abc;efg');

            expect(filter.apply(fixtureDate('EFGH'))).toEqual(true);
        });

        it('keeps dates with any note containing filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('cdef');

            expect(filter.apply(fixtureDate('abcdef'))).toEqual(true);
        });

        it('keeps dates with any note containing filter ignoring case', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('CDEF');

            expect(filter.apply(fixtureDate('abcdef'))).toEqual(true);
        });

        it('keeps dates with any note matching regex filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('^singles');

            expect(filter.apply(fixtureDate('singles'))).toEqual(true);
        });

        it('keeps dates with any note matching regex filter ignoring case', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('^singles');

            expect(filter.apply(fixtureDate('singles'))).toEqual(true);
        });

        it('excludes dates where note does not match regex filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('^singles');

            expect(filter.apply(fixtureDate('divisional singles'))).toEqual(false);
        });

        it('ignores dates without any note matching filter', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getNotesFilter('abc;efg');

            expect(filter.apply(fixtureDate('ijkl'))).toEqual(false);
        });
    });

    describe('getFixtureFilters', () => {
        it('returns positive filter when expression is empty', () => {
            const filter: IFilter<IFixtureMapping> = getFixtureFilters('');

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

            expect(filter.apply(fixtureDate())).toEqual(false);
        });

        it('returns positive when no notes, fixtures or tournaments and new', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({}, {}, []);

            expect(filter.apply(fixtureDate(undefined, undefined, undefined, true))).toEqual(true);
        });

        it('returns positive when notes but no fixtures or tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({}, {}, []);

            expect(filter.apply(fixtureDate('NOTE'))).toEqual(true);
        });

        it('returns positive when no notes but has fixtures and tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({}, {}, []);

            expect(filter.apply(fixtureDate(undefined, fixture, tournament))).toEqual(true);
        });

        it('returns negative when notes but no fixtures or tournaments', () => {
            const filter: IFilter<IEditableDivisionFixtureDateDto> = getFixtureDateFilters({notes: 'only-with-fixtures'}, {}, []);

            expect(filter.apply(fixtureDate('NOTE'))).toEqual(false);
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