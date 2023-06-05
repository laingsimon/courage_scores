// noinspection JSUnresolvedFunction

import {Filter, AndFilter, OrFilter, NotFilter, NullFilter} from "./Filter";

describe('Filter', () => {
    describe('Filter', () => {
        it('throws if expression is null', () => {
            expect(() => new Filter(null)).toThrow()
        });

        it('returns true', () => {
            const filter = new Filter(x => x === 'a');

            const result = filter.apply('a');

            expect(result).toEqual(true);
        });

        it('returns false', () => {
            const filter = new Filter(x => x === 'a');

            const result = filter.apply('b');

            expect(result).toEqual(false);
        });
    });

    describe('AndFilter', () => {
        it('throws if filters are null', () => {
            expect(() => new AndFilter(null)).toThrow('Filters not supplied');
        });

        it('returns true', () => {
            const filter1 = new Filter(x => x < 10);
            const filter2 = new Filter(x => x < 5);
            const andFilter = new AndFilter([ filter1, filter2 ]);

            const result = andFilter.apply(1);

            expect(result).toEqual(true);
        });

        it('returns false', () => {
            const filter1 = new Filter(x => x < 10);
            const filter2 = new Filter(x => x < 5);
            const andFilter = new AndFilter([ filter1, filter2 ]);

            const result = andFilter.apply(5);

            expect(result).toEqual(false);
        });

        it('returns true when no filters', () => {
            const andFilter = new AndFilter([]);

            const result = andFilter.apply(1);

            expect(result).toEqual(true);
        });
    });

    describe('OrFilter', () => {
        it('throws if filters are null', () => {
            expect(() => new OrFilter(null)).toThrow('Filters not supplied');
        });

        it('returns true', () => {
            const filter1 = new Filter(x => x < 10);
            const filter2 = new Filter(x => x < 5);
            const orFilter = new OrFilter([ filter1, filter2 ]);

            const result = orFilter.apply(9);

            expect(result).toEqual(true);
        });

        it('returns false', () => {
            const filter1 = new Filter(x => x < 10);
            const filter2 = new Filter(x => x < 5);
            const orFilter = new OrFilter([ filter1, filter2 ]);

            const result = orFilter.apply(11);

            expect(result).toEqual(false);
        });

        it('returns false when no filters', () => {
            const orFilter = new OrFilter([]);

            const result = orFilter.apply(1);

            expect(result).toEqual(false);
        });
    });

    describe('NotFilter', () => {
        it('throws if filter is null', () => {
            expect(() => new NotFilter(null)).toThrow('Filter not supplied');
        });

        it('returns true', () => {
            const filter = new Filter(x => x < 10);
            const notFilter = new NotFilter(filter);

            const result = notFilter.apply(10);

            expect(result).toEqual(true);
        });

        it('returns false', () => {
            const filter = new Filter(x => x < 10);
            const notFilter = new NotFilter(filter);

            const result = notFilter.apply(5);

            expect(result).toEqual(false);
        });
    });

    describe('NullFilter', () => {
        it('returns true', () => {
            const filter = new NullFilter();

            const result = filter.apply({ anything: true });

            expect(result).toEqual(true);
        });
    });
});