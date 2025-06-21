import {
    getDateFilter,
    getFixtureDateFilters,
    getFixtureFilters,
    getNotesFilter,
    getTeamFilter,
    getTypeFilter,
    IFixtureMapping,
    getFilter,
    IRenderContext,
    isLastFixtureBeforeToday,
    isNextFixtureAfterToday,
    optionallyInvertFilter,
} from './filters';
import { IFilter } from './IFilter';
import {
    divisionFixtureBuilder,
    fixtureDateBuilder,
    noteBuilder,
} from '../../helpers/builders/divisions';
import { tournamentBuilder } from '../../helpers/builders/tournaments';
import { teamBuilder } from '../../helpers/builders/teams';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';
import { Filter, NullFilter } from './Filter';
import { fixtureBuilder } from '../../helpers/builders/games';
import { DivisionFixtureDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDto';
import { DivisionTournamentFixtureDetailsDto } from '../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto';
import { IEditableDivisionFixtureDateDto } from './IEditableDivisionFixtureDateDto';

describe('filters', () => {
    const today = date(0);
    const future = date(1);
    const past = date(-1);
    const lastWeekDate = date(0, -7);
    const yesterdayDate = date(0, -1);
    const tomorrowDate = date(0, 1);
    const nextWeekDate = date(0, 7);
    const fixture = fixtureBuilder().bye('HOME').build();
    const tournament = tournamentBuilder().build();

    function date(monthOffset: number, dayOffset: number = 0) {
        let date = new Date();
        date.setDate(date.getDate() + dayOffset);
        date.setMonth(date.getMonth() + monthOffset);
        return date.toISOString();
    }

    function notableDate(note?: string) {
        return {
            date: '',
            notes: note ? [noteBuilder().note(note).build()] : [],
        };
    }

    function fixtureMapping(fixture?: DivisionFixtureDto): IFixtureMapping {
        return {
            fixture,
        };
    }

    function tournamentMap(t: DivisionTournamentFixtureDetailsDto) {
        return {
            tournamentFixture: t,
        };
    }

    describe('isLastFixtureBeforeToday', () => {
        it('returns true if date is same as lastFixtureDateBeforeToday', () => {
            const context = {
                lastFixtureDateBeforeToday: past,
            };

            expect(isLastFixtureBeforeToday(context, [], past)).toEqual(true);
        });

        it('returns false if date is not same as lastFixtureDateBeforeToday', () => {
            const context = {
                lastFixtureDateBeforeToday: today,
            };

            expect(isLastFixtureBeforeToday(context, [], past)).toEqual(false);
        });

        it('sets lastFixtureDateBeforeToday if any fixture dates in past', () => {
            const context: IRenderContext = {};
            const pastDate = fixtureDateBuilder(past).build();

            const result = isLastFixtureBeforeToday(context, [pastDate], past);

            expect(context.lastFixtureDateBeforeToday).toEqual(past);
            expect(result).toEqual(true);
        });

        it('does not set lastFixtureDateBeforeToday if no fixture dates', () => {
            const context: IRenderContext = {};

            const result = isLastFixtureBeforeToday(context, [], past);

            expect(context.lastFixtureDateBeforeToday).toEqual(
                'no fixtures in past',
            );
            expect(result).toEqual(false);
        });
    });

    describe('isNextFixtureAfterToday', () => {
        it('is today then returns false', () => {
            const result = isNextFixtureAfterToday({}, today);

            expect(result).toEqual(false);
        });

        it('is in past then returns false', () => {
            const result = isNextFixtureAfterToday({}, past);

            expect(result).toEqual(false);
        });

        it('is in future and future date not shown then returns true', () => {
            const emptyContext: IRenderContext = {};
            const result = isNextFixtureAfterToday(emptyContext, future);

            expect(emptyContext.futureDateShown).toEqual(future);
            expect(result).toEqual(true);
        });

        it('is in future and future date is same as date then returns true', () => {
            const context = {
                futureDateShown: future,
            };

            const result = isNextFixtureAfterToday(context, future);

            expect(result).toEqual(true);
        });

        it('is in future and future date is not same as date then returns false', () => {
            const context = {
                futureDateShown: future,
            };

            const result = isNextFixtureAfterToday(context, date(2));

            expect(result).toEqual(false);
        });
    });

    describe('optionallyInvertFilter', () => {
        const getFilter = (
            filter: string | undefined,
            context: IRenderContext,
            fixtures: DivisionFixtureDateDto[],
        ) => {
            call = { filter, context, fixtures };
            return stubFilter!;
        };
        let call: {
            filter: string | undefined;
            context: IRenderContext;
            fixtures: DivisionFixtureDateDto[];
        } | null;
        let stubFilter: IFilter<string> | null;

        beforeEach(() => {
            call = null;
            stubFilter = new NullFilter<string>();
        });

        it('returns filter if empty', () => {
            const context = { futureDateShown: '1' };
            const fixtures = [{ date: '2' }];

            const result = optionallyInvertFilter(
                getFilter,
                '',
                context,
                fixtures,
            );

            expect(call!.filter).toEqual('');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result).toEqual(stubFilter);
        });

        it('returns filter if it does not start with not(', () => {
            const context: IRenderContext = { futureDateShown: '1' };
            const fixtures: DivisionFixtureDateDto[] = [{ date: '2' }];

            const result = optionallyInvertFilter(
                getFilter,
                'a=b',
                context,
                fixtures,
            );

            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result).toEqual(stubFilter);
        });

        it('returns null filter if no filter created and filter start with not(', () => {
            const context: IRenderContext = { futureDateShown: '1' };
            const fixtures: DivisionFixtureDateDto[] = [{ date: '2' }];
            stubFilter = null;

            const result = optionallyInvertFilter(
                getFilter,
                'not(a=b)',
                context,
                fixtures,
            );

            expect(call!.filter).toEqual('a=b');
            expect(call!.context).toEqual(context);
            expect(call!.fixtures).toEqual(fixtures);
            expect(result.apply('')).toEqual(true);
        });

        it('returns inverted filter if filter created and filter start with not(', () => {
            const context: IRenderContext = { futureDateShown: '1' };
            const fixtures: DivisionFixtureDateDto[] = [{ date: '2' }];
            stubFilter = new Filter<string>((_) => true);

            const result = optionallyInvertFilter(
                getFilter,
                'not(a=b)',
                context,
                fixtures,
            );

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
            const f = getDateFilter('past', {}, []);

            expect(f.apply({ date: past })).toEqual(true);
            expect(f.apply({ date: today })).toEqual(false);
            expect(f.apply({ date: future })).toEqual(false);
        });

        it('when future', () => {
            const f = getDateFilter('future', {}, []);

            expect(f.apply({ date: past })).toEqual(false);
            expect(f.apply({ date: today })).toEqual(false);
            expect(f.apply({ date: future })).toEqual(true);
        });

        it('when last+next', () => {
            const f = getDateFilter('last+next', context, []);

            expect(f.apply({ date: date(-2) })).toEqual(false);
            expect(f.apply({ date: past })).toEqual(true);
            expect(f.apply({ date: today })).toEqual(true);
            expect(f.apply({ date: future })).toEqual(true);
            expect(f.apply({ date: date(2) })).toEqual(false);
        });

        it('when last-week', () => {
            const f = getDateFilter('last-week', context, []);

            expect(f.apply({ date: date(-2) })).toEqual(false);
            expect(f.apply({ date: past })).toEqual(false);
            expect(f.apply({ date: lastWeekDate })).toEqual(true);
            expect(f.apply({ date: today })).toEqual(false);
            expect(f.apply({ date: nextWeekDate })).toEqual(false);
            expect(f.apply({ date: future })).toEqual(false);
            expect(f.apply({ date: date(2) })).toEqual(false);
        });

        it('when yesterday', () => {
            const f = getDateFilter('yesterday', context, []);

            expect(f.apply({ date: date(-2) })).toEqual(false);
            expect(f.apply({ date: past })).toEqual(false);
            expect(f.apply({ date: yesterdayDate })).toEqual(true);
            expect(f.apply({ date: today })).toEqual(false);
            expect(f.apply({ date: tomorrowDate })).toEqual(false);
            expect(f.apply({ date: future })).toEqual(false);
            expect(f.apply({ date: date(2) })).toEqual(false);
        });

        it('when today', () => {
            const f = getDateFilter('today', context, []);

            expect(f.apply({ date: date(-2) })).toEqual(false);
            expect(f.apply({ date: past })).toEqual(false);
            expect(f.apply({ date: yesterdayDate })).toEqual(false);
            expect(f.apply({ date: today })).toEqual(true);
            expect(f.apply({ date: tomorrowDate })).toEqual(false);
            expect(f.apply({ date: future })).toEqual(false);
            expect(f.apply({ date: date(2) })).toEqual(false);
        });

        it('when tomorrow', () => {
            const f = getDateFilter('tomorrow', context, []);

            expect(f.apply({ date: date(-2) })).toEqual(false);
            expect(f.apply({ date: past })).toEqual(false);
            expect(f.apply({ date: yesterdayDate })).toEqual(false);
            expect(f.apply({ date: today })).toEqual(false);
            expect(f.apply({ date: tomorrowDate })).toEqual(true);
            expect(f.apply({ date: future })).toEqual(false);
            expect(f.apply({ date: date(2) })).toEqual(false);
        });

        it('when next-week', () => {
            const f = getDateFilter('next-week', context, []);

            expect(f.apply({ date: date(-2) })).toEqual(false);
            expect(f.apply({ date: past })).toEqual(false);
            expect(f.apply({ date: lastWeekDate })).toEqual(false);
            expect(f.apply({ date: today })).toEqual(false);
            expect(f.apply({ date: nextWeekDate })).toEqual(true);
            expect(f.apply({ date: future })).toEqual(false);
            expect(f.apply({ date: date(2) })).toEqual(false);
        });

        it('when matches date yyyy-MM format', () => {
            const f = getDateFilter('2023-02', {}, []);

            expect(f.apply({ date: '2023-02-01T00:00:00' })).toEqual(true);
            expect(f.apply({ date: '2023-02-02T00:00:00' })).toEqual(true);
            expect(f.apply({ date: '2023-03-03T00:00:00' })).toEqual(false);
        });

        it('when matches date yyyy-MM,yyyy-MM format', () => {
            const f = getDateFilter('2023-02,2023-03', {}, []);

            expect(f.apply({ date: '2023-01-01T00:00:00' })).toEqual(false);
            expect(f.apply({ date: '2023-02-01T00:00:00' })).toEqual(true);
            expect(f.apply({ date: '2023-02-02T00:00:00' })).toEqual(true);
            expect(f.apply({ date: '2023-03-03T00:00:00' })).toEqual(true);
            expect(f.apply({ date: '2023-04-04T00:00:00' })).toEqual(false);
        });

        it('when matches date yyyy-MM-dd format', () => {
            const f = getDateFilter('2023-02-01', {}, []);

            expect(f.apply({ date: '2023-02-01T00:00:00' })).toEqual(true);
            expect(f.apply({ date: '2023-02-02T00:00:00' })).toEqual(false);
            expect(f.apply({ date: '2023-03-03T00:00:00' })).toEqual(false);
        });

        it('when matches date yyyy-MM-dd,yyyy-MM-dd format', () => {
            const f = getDateFilter('2023-02-01,2023-03-03', {}, []);

            expect(f.apply({ date: '2023-02-01T00:00:00' })).toEqual(true);
            expect(f.apply({ date: '2023-02-02T00:00:00' })).toEqual(false);
            expect(f.apply({ date: '2023-03-03T00:00:00' })).toEqual(true);
        });

        it('otherwise returns null filter', () => {
            const f = getDateFilter('foo', {}, []);

            const emptyDate = {
                date: '',
            };
            expect(f.apply(emptyDate)).toEqual(true);
        });
    });

    describe('getTypeFilter', () => {
        it('when league', () => {
            const f = getTypeFilter('league');

            expect(f.apply(fixtureMapping(fixture))).toEqual(true);
            expect(f.apply(fixtureMapping())).toEqual(false);
            expect(f.apply(tournamentMap(tournament))).toEqual(false);
        });

        it('when qualifier', () => {
            const f = getTypeFilter('qualifier');

            const knockout = divisionFixtureBuilder().knockout().build();
            expect(f.apply(fixtureMapping(knockout))).toEqual(true);
            expect(f.apply(fixtureMapping())).toEqual(false);
            expect(f.apply(fixtureMapping(fixture))).toEqual(false);
        });

        it('when tournament', () => {
            const f = getTypeFilter('tournament');

            const propTournament = tournamentBuilder().proposed().build();
            expect(f.apply(tournamentMap(tournament))).toEqual(true);
            expect(f.apply(tournamentMap(propTournament))).toEqual(true);
        });

        it('otherwise', () => {
            const f = getTypeFilter('foo');

            expect(f).not.toBeNull();
        });
    });

    describe('getTeamFilter', () => {
        const abcdTeam = teamBuilder('name', 'abcd').build();
        const tournamentAbcdPlaying = tournamentBuilder()
            .withSide((s) => s.name('name').teamId('abcd'))
            .build();
        const byeAbcd = divisionFixtureBuilder().bye(abcdTeam).build();
        const homeTeam = teamBuilder('HOME').build();
        const homeAbcd = divisionFixtureBuilder()
            .playing(homeTeam, abcdTeam)
            .build();

        it('when empty', () => {
            expect(getTeamFilter('').apply({})).toEqual(true);
        });

        it('when id provided', () => {
            const awayAbcd = divisionFixtureBuilder()
                .playing(homeTeam, abcdTeam)
                .build();

            const f = getTeamFilter('abcd');

            expect(f.apply(fixtureMapping(byeAbcd))).toEqual(true);
            expect(f.apply(fixtureMapping(awayAbcd))).toEqual(true);
            expect(f.apply(tournamentMap(tournamentAbcdPlaying))).toEqual(true);
        });

        it('when name provided', () => {
            const f = getTeamFilter('name');

            expect(f.apply(fixtureMapping(byeAbcd))).toEqual(true);
            expect(f.apply(fixtureMapping(homeAbcd))).toEqual(true);
            expect(f.apply(tournamentMap(tournamentAbcdPlaying))).toEqual(true);
        });

        it('when name provided ignores case', () => {
            const f = getTeamFilter('NAME');

            expect(f.apply(fixtureMapping(byeAbcd))).toEqual(true);
            expect(f.apply(fixtureMapping(homeAbcd))).toEqual(true);
            expect(f.apply(tournamentMap(tournamentAbcdPlaying))).toEqual(true);
        });
    });

    describe('getNotesFilter', () => {
        it('filters out dates with no fixtures and no tournaments', () => {
            const f = getNotesFilter('only-with-fixtures');

            expect(f.apply(notableDate('NOTE'))).toEqual(false);
        });

        it('keeps dates with notes and no fixtures or tournaments', () => {
            const f = getNotesFilter('');

            expect(f.apply(notableDate('NOTE'))).toEqual(true);
        });

        it('keeps dates with single note matching filter', () => {
            const f = getNotesFilter('abc');

            expect(f.apply(notableDate('abcd'))).toEqual(true);
        });

        it('keeps dates with any note matching any filter criteria', () => {
            const f = getNotesFilter('abc;efg');

            expect(
                f.apply({
                    date: '',
                    notes: [
                        noteBuilder().note('another note').build(),
                        noteBuilder().note('efgh').build(),
                    ],
                }),
            ).toEqual(true);
        });

        it('keeps dates with any note matching filter ignoring case', () => {
            const f = getNotesFilter('abc;efg');

            expect(f.apply(notableDate('EFGH'))).toEqual(true);
        });

        it('keeps dates with any note containing filter', () => {
            const f = getNotesFilter('cdef');

            expect(f.apply(notableDate('abcdef'))).toEqual(true);
        });

        it('keeps dates with any note containing filter ignoring case', () => {
            const f = getNotesFilter('CDEF');

            expect(f.apply(notableDate('abcdef'))).toEqual(true);
        });

        it('keeps dates with any note matching regex filter', () => {
            const f = getNotesFilter('^singles');

            expect(f.apply(notableDate('singles'))).toEqual(true);
        });

        it('keeps dates with any note matching regex filter ignoring case', () => {
            const f = getNotesFilter('^singles');

            expect(f.apply(notableDate('singles'))).toEqual(true);
        });

        it('excludes dates where note does not match regex filter', () => {
            const f = getNotesFilter('^singles');

            expect(f.apply(notableDate('divisional singles'))).toEqual(false);
        });

        it('ignores dates without any note matching filter', () => {
            const f = getNotesFilter('abc;efg');

            expect(f.apply(notableDate('ijkl'))).toEqual(false);
        });
    });

    describe('getFixtureFilters', () => {
        it('returns positive filter when expression is empty', () => {
            const f = getFixtureFilters('');

            expect(f.apply({})).toEqual(true);
        });

        it('returns filter when expression is not empty', () => {
            const f = getFixtureFilters({
                type: 'league',
            });

            expect(f).not.toBeNull();
        });
    });

    describe('getFixtureDateFilters', () => {
        it('returns negative when no notes, fixtures or tournaments and not new', () => {
            const f = getFixtureDateFilters({}, {});

            expect(f.apply(notableDate())).toEqual(false);
        });

        it('returns positive when no notes, fixtures or tournaments and new', () => {
            const newFixtureDate: IEditableDivisionFixtureDateDto = {
                date: '',
                isNew: true,
            };

            const f = getFixtureDateFilters({}, {});

            expect(f.apply(newFixtureDate)).toEqual(true);
        });

        it('returns positive when notes but no fixtures or tournaments', () => {
            const f = getFixtureDateFilters({}, {});

            expect(f.apply(notableDate('NOTE'))).toEqual(true);
        });

        it('returns positive when no notes but has fixtures and tournaments', () => {
            const fixtureDate: IEditableDivisionFixtureDateDto = {
                date: '',
                fixtures: [fixture],
                tournamentFixtures: [tournament],
            };

            const f = getFixtureDateFilters({}, {});
            expect(f.apply(fixtureDate)).toEqual(true);
        });

        it('returns negative when notes but no fixtures or tournaments', () => {
            const context = { notes: 'only-with-fixtures' };
            const f = getFixtureDateFilters(context, {});

            expect(f.apply(notableDate('NOTE'))).toEqual(false);
        });

        it('returns filter for dates', () => {
            expect(getFixtureDateFilters({ date: 'past' }, {})).not.toBeNull();
        });
    });

    describe('initFilter', () => {
        function get(search: string) {
            return getFilter({
                search,
            });
        }

        it('inits date filter', () => {
            expect(get('?date=past')).toEqual({ date: 'past' });
        });

        it('inits type filter', () => {
            expect(get('?type=league')).toEqual({ type: 'league' });
        });

        it('inits team filter', () => {
            expect(get('?team=abcd')).toEqual({ team: 'abcd' });
        });

        it('inits notes filter', () => {
            expect(get('?notes=abcd')).toEqual({ notes: 'abcd' });
        });

        it('accepts no filter expressions', () => {
            expect(get('?')).toEqual({});
            expect(get('')).toEqual({});
        });

        it('inits multiple filters', () => {
            const f = get('?team=abcd&date=past&type=league');

            expect(f).toEqual({
                team: 'abcd',
                date: 'past',
                type: 'league',
            });
        });
    });
});
