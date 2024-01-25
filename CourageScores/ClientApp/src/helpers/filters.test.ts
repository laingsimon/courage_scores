// noinspection JSUnresolvedReference

import {
    changeFilter,
    getDateFilter,
    getFixtureDateFilters,
    getFixtureFilters,
    getNotesFilter,
    getTeamFilter,
    getTypeFilter, IInitialisedFilters,
    initFilter, IRenderContext,
    isLastFixtureBeforeToday,
    isNextFixtureAfterToday,
    optionallyInvertFilter
} from "./filters";
import {IFilter} from "../interfaces/IFilter";
import {divisionFixtureBuilder, fixtureDateBuilder, noteBuilder} from "./builders/divisions";
import {tournamentBuilder} from "./builders/tournaments";
import {teamBuilder} from "./builders/teams";

describe('filters', () => {
    const today = date(0);
    const future = date(1);
    const past = date(-1);

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
            const context: IRenderContext = {id: 1} as any;
            const fixtures = [{id: 2}];
            const stubFilter: IFilter = {id: 3} as any;
            let call: {filter: string, context: any, fixtures: any};
            const getFilter = (filter: string, context: any, fixtures: any) => {
                call = {filter, context, fixtures};
                return stubFilter;
            };

            const result: IFilter = optionallyInvertFilter(getFilter, '', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result).toEqual(stubFilter);
        });

        it('returns filter if it does not start with not(', () => {
            const context: IRenderContext = {id: 1} as any;
            const fixtures = [{id: 2}];
            const stubFilter: IFilter = {id: 3} as any;
            let call: {filter: string, context: any, fixtures: any};
            const getFilter = (filter: string, context: any, fixtures: any) => {
                call = {filter, context, fixtures};
                return stubFilter;
            };

            const result: IFilter = optionallyInvertFilter(getFilter, 'a=b', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result).toEqual(stubFilter);
        });

        it('returns null filter if no filter created and filter start with not(', () => {
            const context: IRenderContext = {id: 1} as any;
            const fixtures = [{id: 2}];
            let call: {filter: string, context: any, fixtures: any};
            const getFilter = (filter: string, context: any, fixtures: any) => {
                call = {filter, context, fixtures};
                return null;
            };

            const result: IFilter = optionallyInvertFilter(getFilter, 'not(a=b)', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result.apply({})).toEqual(true);
        });

        it('returns inverted filter if filter created and filter start with not(', () => {
            const context: IRenderContext = {id: 1} as any;
            const fixtures = [{id: 2}];
            const stubFilter: IFilter & {id: number} = {
                id: 3,
                apply: () => true
            };
            let call: {filter: string, context: any, fixtures: any};
            const getFilter = (filter: string, context: any, fixtures: any) => {
                call = {filter, context, fixtures};
                return stubFilter;
            };

            const result: IFilter = optionallyInvertFilter(getFilter, 'not(a=b)', context, fixtures);

            expect(call!).toBeTruthy();
            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result.apply({})).toEqual(false);
        });
    });

    describe('getDateFilter', () => {
        it('when past', () => {
            const filter = getDateFilter('past', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: past})).toEqual(true);
            expect(filter.apply({date: today})).toEqual(false);
            expect(filter.apply({date: future})).toEqual(false);
        });

        it('when future', () => {
            const filter = getDateFilter('future', {}, []);

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
            const filter = getDateFilter('last+next', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: date(-2)})).toEqual(false);
            expect(filter.apply({date: past})).toEqual(true);
            expect(filter.apply({date: today})).toEqual(true);
            expect(filter.apply({date: future})).toEqual(true);
            expect(filter.apply({date: date(2)})).toEqual(false);
        });

        it('when matches date yyyy-MM format', () => {
            const filter: IFilter = getDateFilter('2023-02', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: '2023-02-01T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-02-02T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-03-03T00:00:00'})).toEqual(false);
        });

        it('when matches date yyyy-MM,yyyy-MM format', () => {
            const filter: IFilter = getDateFilter('2023-02,2023-03', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: '2023-01-01T00:00:00'})).toEqual(false);
            expect(filter.apply({date: '2023-02-01T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-02-02T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-03-03T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-04-04T00:00:00'})).toEqual(false);
        });

        it('when matches date yyyy-MM-dd format', () => {
            const filter: IFilter = getDateFilter('2023-02-01', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: '2023-02-01T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-02-02T00:00:00'})).toEqual(false);
            expect(filter.apply({date: '2023-03-03T00:00:00'})).toEqual(false);
        });

        it('when matches date yyyy-MM-dd,yyyy-MM-dd format', () => {
            const filter: IFilter = getDateFilter('2023-02-01,2023-03-03', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({date: '2023-02-01T00:00:00'})).toEqual(true);
            expect(filter.apply({date: '2023-02-02T00:00:00'})).toEqual(false);
            expect(filter.apply({date: '2023-03-03T00:00:00'})).toEqual(true);
        });

        it('otherwise returns null filter', () => {
            const filter: IFilter = getDateFilter('foo', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });
    });

    describe('getTypeFilter', () => {
        it('when league', () => {
            const filter: IFilter = getTypeFilter('league');

            expect(filter.apply({
                tournamentFixture: null,
                fixture: divisionFixtureBuilder().build(),
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: null,
                note: {},
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: {},
                note: {},
            })).toEqual(false);
            expect(filter.apply({
                tournamentFixture: null,
            })).toEqual(false);
        });

        it('when qualifier', () => {
            const filter: IFilter = getTypeFilter('qualifier');

            expect(filter.apply({
                fixture: divisionFixtureBuilder().knockout().build(),
            })).toEqual(true);
            expect(filter.apply({
                note: {},
            })).toEqual(true);
            expect(filter.apply({
                fixture: divisionFixtureBuilder().build(),
            })).toEqual(false);
        });

        it('when tournament', () => {
            const filter: IFilter = getTypeFilter('tournament');

            expect(filter.apply({
                tournamentFixture: tournamentBuilder().build(),
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: tournamentBuilder().proposed().build(),
                note: {}
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: tournamentBuilder().proposed().build(),
            })).toEqual(false);
        });

        it('otherwise', () => {
            const filter: IFilter = getTypeFilter('foo');

            expect(filter).not.toBeNull();
        });
    });

    describe('getTeamFilter', () => {
        it('when empty', () => {
            const filter: IFilter = getTeamFilter('');

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });

        it('when id provided', () => {
            const filter: IFilter = getTeamFilter('abcd');

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
                tournamentFixture: tournamentBuilder().withSide((s: any) => s.teamId('abcd')).build(),
            })).toEqual(true);
        });

        it('when name provided', () => {
            const filter: IFilter = getTeamFilter('name');

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
                tournamentFixture: tournamentBuilder().withSide((s: any) => s.name('name').teamId('abcd')).build(),
            })).toEqual(true);
        });

        it('when name provided ignores case', () => {
            const filter: IFilter = getTeamFilter('NAME');

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
                tournamentFixture: tournamentBuilder().withSide((s: any) => s.name('name').teamId('abcd')).build(),
            })).toEqual(true);
        });
    });

    describe('getNotesFilter', () => {
        it('filters out dates with no fixtures and no tournaments', () => {
            const filter: IFilter = getNotesFilter('only-with-fixtures');

            expect(filter.apply({
                notes: [{}],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });

        it('keeps dates with notes and no fixtures or tournaments', () => {
            const filter: IFilter = getNotesFilter('');

            expect(filter.apply({
                notes: [{}],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with single note matching filter', () => {
            const filter: IFilter = getNotesFilter('abc');

            expect(filter.apply({
                notes: [noteBuilder().note('abcd').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note matching any filter criteria', () => {
            const filter: IFilter = getNotesFilter('abc;efg');

            expect(filter.apply({
                notes: [noteBuilder().note('another note').build(), noteBuilder().note('efgh').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('keeps dates with any note matching filter ignoring case', () => {
            const filter: IFilter = getNotesFilter('abc;efg');

            expect(filter.apply({
                notes: [noteBuilder().note('EFGH').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('ignores dates without any note matching filter', () => {
            const filter: IFilter = getNotesFilter('abc;efg');

            expect(filter.apply({
                notes: [noteBuilder().note('ijkl').build()],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });
    });

    describe('getFixtureFilters', () => {
        it('returns positive filter when expression is empty', () => {
            const filter: IFilter = getFixtureFilters('');

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });

        it('returns filter when expression is not empty', () => {
            const filter: IFilter = getFixtureFilters({type: 'league'});

            expect(filter).not.toBeNull();
        });
    });

    describe('getFixtureDateFilters', () => {
        it('returns negative when no notes, fixtures or tournaments and not new', () => {
            const filter: IFilter = getFixtureDateFilters({}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });

        it('returns positive when no notes, fixtures or tournaments and new', () => {
            const filter: IFilter = getFixtureDateFilters({}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [],
                fixtures: [],
                tournamentFixtures: [],
                isNew: true,
            })).toEqual(true);
        });

        it('returns positive when notes but no fixtures or tournaments', () => {
            const filter: IFilter = getFixtureDateFilters({}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [{}],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(true);
        });

        it('returns positive when no notes but has fixtures and tournaments', () => {
            const filter: IFilter = getFixtureDateFilters({}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [],
                fixtures: [{}],
                tournamentFixtures: [{}],
            })).toEqual(true);
        });

        it('returns negative when notes but no fixtures or tournaments', () => {
            const filter: IFilter = getFixtureDateFilters({notes: 'only-with-fixtures'}, {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({
                notes: [{}],
                fixtures: [],
                tournamentFixtures: [],
            })).toEqual(false);
        });

        it('returns filter for dates', () => {
            const filter: IFilter = getFixtureDateFilters({date: 'past'}, {}, []);

            expect(filter).not.toBeNull();
        });
    });

    describe('initFilter', () => {
        it('inits date filter', () => {
            const filter: IInitialisedFilters = initFilter({search: '?date=past'});

            expect(filter).toEqual({date: 'past'});
        });

        it('inits type filter', () => {
            const filter: IInitialisedFilters = initFilter({search: '?type=league'});

            expect(filter).toEqual({type: 'league'});
        });

        it('inits team filter', () => {
            const filter: IInitialisedFilters = initFilter({search: '?team=abcd'});

            expect(filter).toEqual({team: 'abcd'});
        });

        it('inits notes filter', () => {
            const filter: IInitialisedFilters = initFilter({search: '?notes=abcd'});

            expect(filter).toEqual({notes: 'abcd'});
        });

        it('accepts no filter expressions', () => {
            expect(initFilter({search: '?'})).toEqual({});
            expect(initFilter({search: ''})).toEqual({});
        });

        it('inits multiple filters', () => {
            const filter: IInitialisedFilters = initFilter({search: '?team=abcd&date=past&type=league'});

            expect(filter).toEqual({team: 'abcd', date: 'past', type: 'league'});
        });
    });

    describe('changeFilter', () => {
        let updatedFilter: any;
        let navigated: any;
        const setFilter = (filter: any) => {
            updatedFilter = filter
        };
        const navigate = (params: any) => {
            navigated = params
        };
        const location = {pathname: 'path', hash: '#hash'};

        it('sets new filter', () => {
            updatedFilter = null;
            navigated = null;
            const filter: IInitialisedFilters = {new: true} as any;

            changeFilter(filter, setFilter, navigate, location);

            expect(updatedFilter).not.toBeNull();
            expect(updatedFilter).toEqual(filter);
        });

        it('removes unset filters from search', () => {
            updatedFilter = null;
            navigated = null;
            const filter = {type: '', date: 'past'};

            changeFilter(filter, setFilter, navigate, location);

            expect(navigated).toBeTruthy();
            expect(navigated!.search).toEqual('date=past');
            expect(navigated!.pathname).toEqual(location.pathname);
            expect(navigated!.hash).toEqual(location.hash);
        });

        it('navigates with new search params', () => {
            updatedFilter = null;
            navigated = null;
            const filter = {type: 'league', date: 'past'};

            changeFilter(filter, setFilter, navigate, location);

            expect(navigated).toBeTruthy();
            expect(navigated!.search).toContain('date=past');
            expect(navigated!.search).toContain('type=league');
            expect(navigated!.pathname).toEqual(location.pathname);
            expect(navigated!.hash).toEqual(location.hash);
        });
    });
});