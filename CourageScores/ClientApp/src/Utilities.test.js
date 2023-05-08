// noinspection JSUnresolvedReference

import React from "react";
import {
    all,
    any,
    count,
    createTemporaryId,
    elementAt,
    isEmpty,
    max, propChanged,
    repeat,
    round2dp,
    sortBy,
    sum,
    toMap
} from './Utilities';

describe('Utilities', () => {
    describe('toMap', () => {
        it('should return map of items', () => {
            const items = [
                { id: 'a', name: 'a' },
                { id: 'b', name: 'b' },
                { id: 'c', name: 'c' }
            ];

            const map = toMap(items);

            expect(map['a']).toEqual({ id: 'a', name: 'a' });
            expect(map['b']).toEqual({ id: 'b', name: 'b' });
            expect(map['c']).toEqual({ id: 'c', name: 'c' });
        });

        it('should be able to filter items', () => {
            const items = [
                { id: 'a', name: 'a' },
                { id: 'b', name: 'b' },
                { id: 'c', name: 'c' }
            ];

            const filteredItems = toMap(items).filter(item => item.name === 'a');

            expect(filteredItems).toEqual([ { id: 'a', name: 'a' } ]);
        });

        it('should be able to map items', () => {
            const items = [
                { id: 'a', name: 'a' },
                { id: 'b', name: 'b' },
                { id: 'c', name: 'c' }
            ];

            const mappedItems = toMap(items).map(item => item.name.toUpperCase());

            expect(mappedItems).toEqual([ 'A', 'B', 'C' ]);
        });

        it('should be able to sort items', () => {
            const items = [
                { id: 'b', name: 'b' },
                { id: 'a', name: 'a' },
                { id: 'c', name: 'c' }
            ];

            const sortedItems = toMap(items).sort(sortBy('name'));

            expect(sortedItems).toEqual([
                { id: 'a', name: 'a' },
                { id: 'b', name: 'b' },
                { id: 'c', name: 'c' }
            ]);
        });

        it('should return length', () => {
            const items = [
                { id: 'b', name: 'b' },
                { id: 'a', name: 'a' },
                { id: 'c', name: 'c' }
            ];

            const map = toMap(items);

            expect(map.length).toEqual(3);
        });
    });

    describe('sortBy', () => {
        it('should sort items in ascending order', () => {
            const items = [
                { name: 'b' },
                { name: 'c' },
                { name: 'a' }
            ];

            const sorted = items.sort(sortBy('name'));

            expect(sorted).toEqual([
                { name: 'a' },
                { name: 'b' },
                { name: 'c' } ]);
        });

        it('should sort items in descending order', () => {
            const items = [
                { name: 'b' },
                { name: 'c' },
                { name: 'a' }
            ];

            const sorted = items.sort(sortBy('name', true));

            expect(sorted).toEqual([
                { name: 'c' },
                { name: 'b' },
                { name: 'a' } ]);
        });

        it('should sort items by nested property', () => {
            const items = [
                { home: { name: 'b' } },
                { home: { name: 'c' } },
                { home: { name: 'a' } },
            ];

            const sorted = items.sort(sortBy('home.name'));

            expect(sorted).toEqual([
                { home: { name: 'a' } },
                { home: { name: 'b' } },
                { home: { name: 'c' } } ]);
        });
    });

    describe('createTemporaryId', () => {
        it('should create different ids', () => {
            const first = createTemporaryId();
            const second = createTemporaryId();

            expect(second).not.toEqual(first);
        });
    });

    describe('any', () => {
        it('should return true if items found', () => {
           const items = [ 1 ];

           const result = any(items);

           expect(result).toEqual(true);
        });

        it('should return true if items found', () => {
            const items = [ 1, 2 ];

            const result = any(items, i => i < 2);

            expect(result).toEqual(true);
        });

        it('should return false if empty', () => {
            const items = [ ];

            const result = any(items);

            expect(result).toEqual(false);
        });

        it('should return false if none match', () => {
            const items = [ 1, 2, 3 ];

            const result = any(items, i => i > 3);

            expect(result).toEqual(false);
        });
    });

    describe('all', () => {
        it('should return true if empty', () => {
            const items = [];

            const result = all(items);

            expect(result).toEqual(true);
        });

        it('should return true if all match', () => {
            const items = [ 1, 2, 3 ];

            const result = all(items, i => i < 4);

            expect(result).toEqual(true);
        });

        it('should return false if some do not match', () => {
            const items = [ 1, 2, 3 ];

            const result = all(items, i => i <= 2);

            expect(result).toEqual(false);
        });
    });

    describe('isEmpty', () => {
        it('should return true if empty', () => {
            const items = [];

            const result = isEmpty(items);

            expect(result).toEqual(true);
        });

        it('should return true if no items match', () => {
            const items = [ 1, 3, 5 ];

            const result = isEmpty(items, i => i % 2 === 0);

            expect(result).toEqual(true);
        });

        it('should return false if empty', () => {
            const items = [ 1 ];

            const result = isEmpty(items);

            expect(result).toEqual(false);
        });
    });

    describe('count', () => {
        it('returns count of items', () => {
            const items = [ 1, 2, 3 ];

            const result = count(items);

            expect(result).toEqual(3);
        });

        it('returns 0 when empty', () => {
            const items = [ ];

            const result = count(items);

            expect(result).toEqual(0);
        });

        it('returns count of items that match the predicate', () => {
            const items = [ 1, 2, 3 ];

            const result = count(items, i => i < 2);

            expect(result).toEqual(1);
        });

        it('returns 0 when no items match the predicate', () => {
            const items = [ 1, 2, 3 ];

            const result = count(items, i => i > 4);

            expect(result).toEqual(0);
        });
    });

    describe('sum', () => {
        it('should return a sum of the items', () => {
           const items = [ 1, 2, 3 ];

           const result = sum(items, i => i);

           expect(result).toEqual(6);
        });
    });

    describe('max', () => {
       it('should return value of max item', () => {
            const items = [ 1, 2, 3 ];

            const result = max(items, i => i);

            expect(result).toEqual(3);
       });

        it('should return 0 when empty', () => {
            const items = [ ];

            const result = max(items, i => i);

            expect(result).toEqual(0);
        });
    });

    describe('round2dp', () => {
       it('should round numbers', () => {
            const value = 12.345;

            const result = round2dp(value);

            expect(result).toEqual(12.35);
       });

        it('should not affect integers', () => {
            const value = 12;

            const result = round2dp(value);

            expect(result).toEqual(12);
        });
    });

    describe('elementAt', () => {
        it('should return item at index', () => {
           const items = [ 1, 2, 3 ];

           const result = elementAt(items, 1);

           expect(result).toEqual(2);
        });

        it('should return item at index adapted', () => {
            const items = [ 1, 2, 3 ];

            const result = elementAt(items, 1, i => i * 10);

            expect(result).toEqual(20);
        });

        it('should return null if no item at index', () => {
            const items = [ 1, 2, 3 ];

            const result = elementAt(items, 5);

            expect(result).toEqual(null);
        });
    });

    describe('repeat', () => {
        it('should return empty array', () => {
            const result = repeat(0, i => i);

            expect(result).toEqual([]);
        });

        it('should return array of items', () => {
            const result = repeat(2, i => i);

            expect(result).toEqual([ 0, 1 ]);
        });

        it('should return array of index', () => {
            const result = repeat(2);

            expect(result).toEqual([ 0, 1 ]);
        });
    });

    describe('propChanged', () => {
        it('updates single property when named', () => {
            let newValue;

            const func = propChanged({ name: 'Simon', age: 40 }, v => newValue = v, 'name');
            func('Laing');

            expect(newValue).toEqual({ name: 'Laing', age: 40 });
        });

        it('allows property to be provided at update time', () => {
            let newValue;

            const func = propChanged({ name: 'Simon', age: 40 }, v => newValue = v);
            func('name', 'Laing');

            expect(newValue).toEqual({ name: 'Laing', age: 40 });
        });
    });
});