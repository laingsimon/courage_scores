﻿// noinspection JSUnresolvedReference

import {
    changeFilter,
    getDateFilter, getFilters, getTeamIdFilter, getTypeFilter, initFilter,
    isInFuture,
    isInPast,
    isLastFixtureBeforeToday,
    isNextFixtureAfterToday,
    isToday,
    optionallyInvertFilter
} from "./FilterUtilities";

describe('FilterUtilities', () => {
    const today = date(0);
    const future = date(1);
    const past = date(-1);

    function date(monthOffset) {
        let date = new Date();
        date.setMonth(date.getMonth() + monthOffset);
        return date.toISOString();
    }

    describe('isInPast', () => {
        it('returns true for a past date', () => {
            expect(isInPast(past)).toEqual(true);
        });

        it('returns false for today', () => {
            expect(isInPast(today)).toEqual(false);
        });

        it('returns false for a future date', () => {
            expect(isInPast(future)).toEqual(false);
        });
    });

    describe('isInFuture', () => {
        it('returns false for a past date', () => {
            expect(isInFuture(past)).toEqual(false);
        });

        it('returns true for today', () => {
            expect(isInFuture(today)).toEqual(false);
        });

        it('returns true for a future date', () => {
            expect(isInFuture(future)).toEqual(true);
        });
    });

    describe('isToday', () => {
        it('returns false for a past date', () => {
            expect(isToday(past)).toEqual(false);
        });

        it('returns true for today', () => {
            expect(isToday(today)).toEqual(true);
        });

        it('returns false for a future date', () => {
            expect(isToday(future)).toEqual(false);
        });
    });

    describe('isLastFixtureBeforeToday', () => {
        it('returns true if date is same as lastFixtureDateBeforeToday', () => {
            const context = {
                lastFixtureDateBeforeToday: past
            };
            const fixtureDates = [];

            const result = isLastFixtureBeforeToday(context, fixtureDates, past);

            expect(result).toEqual(true);
        });

        it('returns false if date is not same as lastFixtureDateBeforeToday', () => {
            const context = {
                lastFixtureDateBeforeToday: today
            };
            const fixtureDates = [];

            const result = isLastFixtureBeforeToday(context, fixtureDates, past);

            expect(result).toEqual(false);
        });

        it('sets lastFixtureDateBeforeToday if any fixture dates in past', () => {
            const context = {};
            const fixtureDates = [{
                date: past,
                fixtures: []
            }];

            const result = isLastFixtureBeforeToday(context, fixtureDates, past);

            expect(context).toEqual({
                lastFixtureDateBeforeToday: past
            });
            expect(result).toEqual(true);
        });

        it('does not set lastFixtureDateBeforeToday if no fixture dates', () => {
            const context = {};
            const fixtureDates = [];

            const result = isLastFixtureBeforeToday(context, fixtureDates, past);

            expect(context).toEqual({
                lastFixtureDateBeforeToday: 'no fixtures in past'
            });
            expect(result).toEqual(false);
        });
    });

    describe('isNextFixtureAfterToday', () => {
        it('is today then returns false', () => {
            const context = {};

            const result = isNextFixtureAfterToday(context, today);

            expect(result).toEqual(false);
        });

        it('is in past then returns false', () => {
            const context = {};

            const result = isNextFixtureAfterToday(context, past);

            expect(result).toEqual(false);
        });

        it('is in future and future date not shown then returns true', () => {
            const context = {};

            const result = isNextFixtureAfterToday(context, future);

            expect(context.futureDateShown).toEqual(future);
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
                futureDateShown: future
            };

            const result = isNextFixtureAfterToday(context, date(2));

            expect(result).toEqual(false);
        });
    });

    describe('optionallyInvertFilter', () => {
        it('returns filter if empty', () => {
            const context = { id: 1 };
            const fixtures = [{ id: 2 }];
            const stubFilter = { id: 3 };
            let call;
            const getFilter = (filter, context, fixtures) => {
                call = { filter, context, fixtures };
                return stubFilter;
            };

            const result = optionallyInvertFilter(getFilter, '', context, fixtures);

            expect(call).toBeTruthy();
            expect(call.filter).toEqual('');
            expect(call.context).toEqual(context);
            expect(call.fixtures).toEqual(fixtures);
            expect(result).toEqual(stubFilter);
        });

        it('returns filter if it does not start with not(', () => {
            const context = { id: 1 };
            const fixtures = [{ id: 2 }];
            const stubFilter = { id: 3 };
            let call;
            const getFilter = (filter, context, fixtures) => {
                call = { filter, context, fixtures };
                return stubFilter;
            };

            const result = optionallyInvertFilter(getFilter, 'a=b', context, fixtures);

            expect(call).toBeTruthy();
            expect(call.filter).toEqual('a=b');
            expect(call.context).toEqual(context);
            expect(call.fixtures).toEqual(fixtures);
            expect(result).toEqual(stubFilter);
        });

        it('returns null filter if no filter created and filter start with not(', () => {
            const context = { id: 1 };
            const fixtures = [{ id: 2 }];
            let call;
            const getFilter = (filter, context, fixtures) => {
                call = { filter, context, fixtures };
                return null;
            };

            const result = optionallyInvertFilter(getFilter, 'not(a=b)', context, fixtures);

            expect(call).toBeTruthy();
            expect(call.filter).toEqual('a=b');
            expect(call.context).toEqual(context);
            expect(call.fixtures).toEqual(fixtures);
            expect(result.apply({})).toEqual(true);
        });

        it('returns inverted filter if filter created and filter start with not(', () => {
            const context = { id: 1 };
            const fixtures = [{ id: 2 }];
            const stubFilter = {
                id: 3,
                apply: () => true };
            let call;
            const getFilter = (filter, context, fixtures) => {
                call = { filter, context, fixtures };
                return stubFilter;
            };

            const result = optionallyInvertFilter(getFilter, 'not(a=b)', context, fixtures);

            expect(call).toBeTruthy();
            expect(call.filter).toEqual('a=b');
            expect(call.context).toEqual(context);
            expect(call.fixtures).toEqual(fixtures);
            expect(result.apply({})).toEqual(false);
        });
    });

    describe('getDateFilter', () => {
        it('when past', () => {
            const filter = getDateFilter('past', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({ date: past })).toEqual(true);
            expect(filter.apply({ date: today })).toEqual(false);
            expect(filter.apply({ date: future })).toEqual(false);
        });

        it('when future', () => {
            const filter = getDateFilter('future', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({ date: past })).toEqual(false);
            expect(filter.apply({ date: today })).toEqual(false);
            expect(filter.apply({ date: future })).toEqual(true);
        });

        it('when last+next', () => {
            const context = {
                lastFixtureDateBeforeToday: past,
                futureDateShown: future,
            };
            const filter = getDateFilter('last+next', context, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({ date: date(-2) })).toEqual(false);
            expect(filter.apply({ date: past })).toEqual(true);
            expect(filter.apply({ date: today })).toEqual(true);
            expect(filter.apply({ date: future })).toEqual(true);
            expect(filter.apply({ date: date(2) })).toEqual(false);
        });

        it('when matches date yyyy-MM format', () => {
            const filter = getDateFilter('2023-02', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({ date: '2023-02-01T00:00:00' })).toEqual(true);
            expect(filter.apply({ date: '2023-02-02T00:00:00' })).toEqual(true);
            expect(filter.apply({ date: '2023-03-03T00:00:00' })).toEqual(false);
        });

        it('otherwise returns null filter', () => {
            const filter = getDateFilter('foo', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });
    });

    describe('getTypeFilter', () => {
        it('when league', () => {
            const filter = getTypeFilter('league');

            expect(filter.apply({
                tournamentFixture: null,
                fixture: {
                    isKnockout: false
                },
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
            const filter = getTypeFilter('qualifier');

            expect(filter.apply({
                fixture: {
                    isKnockout: true
                },
            })).toEqual(true);
            expect(filter.apply({
                note: {},
            })).toEqual(true);
            expect(filter.apply({
                fixture: {
                    isKnockout: false
                },
            })).toEqual(false);
        });

        it('when tournament', () => {
            const filter = getTypeFilter('tournament');

            expect(filter.apply({
                tournamentFixture: {
                    proposed: false
                },
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: {
                    proposed: true
                },
                note: {}
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: {
                    proposed: true
                },
            })).toEqual(false);
        });

        it('otherwise', () => {
            const filter = getTypeFilter('foo');

            expect(filter).not.toBeNull();
        });
    });

    describe('getTeamIdFilter', () => {
        it('when empty', () => {
            const filter = getTeamIdFilter('');

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });

        it('when provided', () => {
            const filter = getTeamIdFilter('abcd');

            expect(filter).not.toBeNull();
            expect(filter.apply({
                fixture: {
                    homeTeam: { id: 'abcd' }
                },
            })).toEqual(true);
            expect(filter.apply({
                fixture: {
                    awayTeam: { id: 'abcd' }
                },
            })).toEqual(true);
            expect(filter.apply({
                tournamentFixture: {
                    sides: [{
                        teamId: 'abcd',
                    }]
                },
            })).toEqual(true);
        });
    });

    describe('getFilters', () => {
        it('returns positive filter when expression is empty', () => {
            const filter = getFilters('', {}, []);

            expect(filter).not.toBeNull();
            expect(filter.apply({})).toEqual(true);
        });

        it('returns filter when expression is not empty', () => {
            const filter = getFilters('date=past', {}, []);

            expect(filter).not.toBeNull();
        });
    });

    describe('initFilter', () => {
        it('inits date filter', () => {
            const filter = initFilter({ search: '?date=past' });

            expect(filter).toEqual({ date: 'past' });
        });

        it('inits type filter', () => {
            const filter = initFilter({ search: '?type=league' });

            expect(filter).toEqual({ type: 'league' });
        });

        it('inits teamId filter', () => {
            const filter = initFilter({ search: '?teamId=abcd' });

            expect(filter).toEqual({ teamId: 'abcd' });
        });

        it('accepts no filter expressions', () => {
            expect(initFilter({ search: '?' })).toEqual({ });
            expect(initFilter({ search: '' })).toEqual({ });
        });

        it('inits multiple filters', () => {
            const filter = initFilter({ search: '?teamId=abcd&date=past&type=league' });

            expect(filter).toEqual({ teamId: 'abcd', date: 'past', type: 'league' });
        });
    });

    describe('changeFilter', () => {
        let updatedFilter;
        let navigated;
        const setFilter = (filter) => { updatedFilter = filter };
        const navigate = (params) => { navigated = params };
        const location = { pathname: 'path', hash: '#hash' };

        it('sets new filter', () => {
            updatedFilter = null;
            navigated = null;
            const filter = { new: true };

            changeFilter(filter, setFilter, navigate, location);

            expect(updatedFilter).not.toBeNull();
            expect(updatedFilter).toEqual(filter);
        });

        it('removes unset filters from search', () => {
            updatedFilter = null;
            navigated = null;
            const filter = { type: '', date: 'past' };

            changeFilter(filter, setFilter, navigate, location);

            expect(navigated).not.toBeNull();
            expect(navigated.search).toEqual('date=past');
            expect(navigated.pathname).toEqual(location.pathname);
            expect(navigated.hash).toEqual(location.hash);
        });

        it('navigates with new search params', () => {
            updatedFilter = null;
            navigated = null;
            const filter = { type: 'league', date: 'past' };

            changeFilter(filter, setFilter, navigate, location);

            expect(navigated).not.toBeNull();
            expect(navigated.search).toContain('date=past');
            expect(navigated.search).toContain('type=league');
            expect(navigated.pathname).toEqual(location.pathname);
            expect(navigated.hash).toEqual(location.hash);
        });
    });
});