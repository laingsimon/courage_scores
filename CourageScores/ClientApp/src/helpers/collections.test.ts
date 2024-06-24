// noinspection JSUnresolvedReference

import {
    all,
    any,
    count,
    distinct,
    elementAt, groupAndSortByOccurrences,
    isEmpty,
    max,
    reverse, skip,
    sortBy,
    sum, take,
    toDictionary,
    toMap
} from "./collections";

describe('collections', () => {
    describe('toMap', () => {
        it('should return map of items', () => {
            const items = [
                {id: 'a', name: 'a'},
                {id: 'b', name: 'b'},
                {id: 'c', name: 'c'}
            ];

            const map = toMap(items);

            expect(map['a']).toEqual({id: 'a', name: 'a'});
            expect(map['b']).toEqual({id: 'b', name: 'b'});
            expect(map['c']).toEqual({id: 'c', name: 'c'});
        });

        it('should be able to filter items', () => {
            const items = [
                {id: 'a', name: 'a'},
                {id: 'b', name: 'b'},
                {id: 'c', name: 'c'}
            ];

            const filteredItems = toMap(items).filter((item: any) => item.name === 'a');

            expect(filteredItems).toEqual([{id: 'a', name: 'a'}]);
        });

        it('should be able to map items', () => {
            const items = [
                {id: 'a', name: 'a'},
                {id: 'b', name: 'b'},
                {id: 'c', name: 'c'}
            ];

            const mappedItems = toMap(items).map((item: any) => item.name.toUpperCase());

            expect(mappedItems).toEqual(['A', 'B', 'C']);
        });

        it('should be able to sort items', () => {
            const items = [
                {id: 'b', name: 'b'},
                {id: 'a', name: 'a'},
                {id: 'c', name: 'c'}
            ];

            const sortedItems = toMap(items).sort(sortBy('name'));

            expect(sortedItems).toEqual([
                {id: 'a', name: 'a'},
                {id: 'b', name: 'b'},
                {id: 'c', name: 'c'}
            ]);
        });

        it('should return length', () => {
            const items = [
                {id: 'b', name: 'b'},
                {id: 'a', name: 'a'},
                {id: 'c', name: 'c'}
            ];

            const map = toMap(items);

            expect(map.length).toEqual(3);
        });
    });

    describe('sortBy', () => {
        it('should sort items in ascending order', () => {
            const items = [
                {name: 'b'},
                {name: 'c'},
                {name: 'a'}
            ];

            const sorted = items.sort(sortBy('name'));

            expect(sorted).toEqual([
                {name: 'a'},
                {name: 'b'},
                {name: 'c'}]);
        });

        it('should sort items in descending order', () => {
            const items = [
                {name: 'b'},
                {name: 'c'},
                {name: 'a'}
            ];

            const sorted = items.sort(sortBy('name', true));

            expect(sorted).toEqual([
                {name: 'c'},
                {name: 'b'},
                {name: 'a'}]);
        });

        it('should sort items by nested property', () => {
            const items = [
                {home: {name: 'b'}},
                {home: {name: 'c'}},
                {home: {name: 'a'}},
            ];

            const sorted = items.sort(sortBy('home.name'));

            expect(sorted).toEqual([
                {home: {name: 'a'}},
                {home: {name: 'b'}},
                {home: {name: 'c'}}]);
        });
    });

    describe('groupAndSortOccurrences', () => {
        it('groups item by property', () => {
            const a1 = { id: 'A' };
            const a2 = { id: 'A' };
            const b1 = { id: 'B' };
            const a3 = { id: 'A' };

            const result = groupAndSortByOccurrences([ a1, a2, b1, a3 ], 'id');

            expect(result.map(i => i.id)).toEqual([ 'A', 'B' ]);
        });

        it('groups item by property where later items have greater occurrences', () => {
            const b1 = { id: 'B' };
            const a1 = { id: 'A' };
            const a2 = { id: 'A' };
            const a3 = { id: 'A' };

            const result = groupAndSortByOccurrences([ b1, a1, a2, a3 ], 'id');

            expect(result.map(i => i.id)).toEqual([ 'A', 'B' ]);
        });

        it('groups item by property where items have same number of occurrences', () => {
            const b1 = { id: 'B' };
            const b2 = { id: 'B' };
            const a1 = { id: 'A' };
            const a2 = { id: 'A' };

            const result = groupAndSortByOccurrences([ b1, a1, a2, b2 ], 'id');

            expect(result.map(i => i.id)).toEqual([ 'A', 'B' ]);
        });

        it('groups item by property where items have same id', () => {
            const a1 = { id: 'A' };
            const a2 = { id: 'A' };

            const result = groupAndSortByOccurrences([ a1, a2 ], 'id');

            expect(result.map(i => i.id)).toEqual([ 'A' ]);
        });

        it('returns items with occurrences in descending order', () => {
            const a1 = { id: 'A' };
            const a2 = { id: 'A' };
            const b1 = { id: 'B' };
            const a3 = { id: 'A' };

            const result = groupAndSortByOccurrences([ a1, a2, b1, a3 ], 'id');

            expect(result.map(i => i.occurrences)).toEqual([ 3, 1 ]);
        });

        it('original items are unmodified', () => {
            const a1 = { id: 'A' };
            const a2 = { id: 'A' };

            groupAndSortByOccurrences([ a1, a2 ], 'id');

            expect(a1).toEqual({ id: 'A' });
            expect(a2).toEqual({ id: 'A' });
        });
    });

    describe('any', () => {
        it('should return true if items found', () => {
            const items = [1];

            const result = any(items);

            expect(result).toEqual(true);
        });

        it('should return true if items found', () => {
            const items = [1, 2];

            const result = any(items, i => i < 2);

            expect(result).toEqual(true);
        });

        it('should return false if empty', () => {
            const items: any[] = [];

            const result = any(items);

            expect(result).toEqual(false);
        });

        it('should return false if none match', () => {
            const items = [1, 2, 3];

            const result = any(items, i => i > 3);

            expect(result).toEqual(false);
        });
    });

    describe('all', () => {
        it('should return true if empty', () => {
            const items: any[] = [];

            const result = all(items);

            expect(result).toEqual(true);
        });

        it('should return true if all match', () => {
            const items = [1, 2, 3];

            const result = all(items, i => i < 4);

            expect(result).toEqual(true);
        });

        it('should return false if some do not match', () => {
            const items = [1, 2, 3];

            const result = all(items, i => i <= 2);

            expect(result).toEqual(false);
        });
    });

    describe('isEmpty', () => {
        it('should return true if empty', () => {
            const items: any[] = [];

            const result = isEmpty(items);

            expect(result).toEqual(true);
        });

        it('should return true if no items match', () => {
            const items = [1, 3, 5];

            const result = isEmpty(items, i => i % 2 === 0);

            expect(result).toEqual(true);
        });

        it('should return false if empty', () => {
            const items = [1];

            const result = isEmpty(items);

            expect(result).toEqual(false);
        });
    });

    describe('count', () => {
        it('returns count of items', () => {
            const items = [1, 2, 3];

            const result = count(items);

            expect(result).toEqual(3);
        });

        it('returns 0 when empty', () => {
            const items: any[] = [];

            const result = count(items);

            expect(result).toEqual(0);
        });

        it('returns count of items that match the predicate', () => {
            const items = [1, 2, 3];

            const result = count(items, i => i < 2);

            expect(result).toEqual(1);
        });

        it('returns 0 when no items match the predicate', () => {
            const items = [1, 2, 3];

            const result = count(items, i => i > 4);

            expect(result).toEqual(0);
        });
    });

    describe('sum', () => {
        it('should return a sum of the items', () => {
            const items = [1, 2, 3];

            const result = sum(items, i => i);

            expect(result).toEqual(6);
        });
    });

    describe('max', () => {
        it('should return value of max item', () => {
            const items = [1, 2, 3];

            const result = max(items, i => i);

            expect(result).toEqual(3);
        });

        it('should return 0 when empty', () => {
            const items: any[] = [];

            const result = max(items, i => i);

            expect(result).toEqual(0);
        });
    });

    describe('elementAt', () => {
        it('should return item at index', () => {
            const items = [1, 2, 3];

            const result = elementAt(items, 1);

            expect(result).toEqual(2);
        });

        it('should return item at index adapted', () => {
            const items = [1, 2, 3];

            const result = elementAt(items, 1, i => i * 10);

            expect(result).toEqual(20);
        });

        it('should return null if no item at index', () => {
            const items = [1, 2, 3];

            const result = elementAt(items, 5);

            expect(result).toEqual(null);
        });
    });

    describe('distinct', () => {
        it('should remove duplicates', () => {
            const items = [
                {name: 'a'},
                {name: 'a'},
                {name: 'b'}
            ];

            const result = distinct(items, 'name');

            expect(result).toEqual([
                {name: 'a'},
                {name: 'b'}]);
        });

        it('should remove duplicates by nested property', () => {
            const items = [
                {home: {name: 'a'}},
                {home: {name: 'a'}},
                {home: {name: 'b'}},
            ];

            const result = distinct(items, 'home.name');

            expect(result).toEqual([
                {home: {name: 'a'}},
                {home: {name: 'b'}}]);
        });

        it('should remove duplicates by numerical values', () => {
            const items = [
                {age: 1},
                {age: 1},
                {age: 2}
            ];

            const result = distinct(items, 'age');

            expect(result).toEqual([
                {age: 1},
                {age: 2}]);
        });

        it('should remove duplicate values', () => {
            const items = [1, 1, 2];

            const result = distinct(items);

            expect(result).toEqual([1, 2]);
        });
    });

    describe('toDictionary', () => {
        it('should return empty map for empty collection', () => {
            const result = toDictionary([], a => a, a => a);

            expect(Object.keys(result)).toEqual([]);
        });

        it('should return map keyed correctly', () => {
            const item1 = {name: 'NAME'};
            const result = toDictionary([item1], a => a.name, a => a);

            expect(Object.keys(result)).toEqual(['NAME']);
        });

        it('should return map with values via selector', () => {
            const item1 = {name: 'NAME', age: 1};
            const result = toDictionary([item1], a => a.name, a => a.age);

            expect(result['NAME']).toEqual(1);
        });

        it('should return map with item values', () => {
            const item1 = {name: 'NAME', age: 1};
            const result = toDictionary([item1], a => a.name);

            expect(result['NAME']).toEqual(item1);
        });

        it('should throw for duplicate ids', () => {
            const item1 = {name: 'NAME', age: 1};
            const item2 = {name: 'NAME', age: 2};
            let error: any;

            try {
                toDictionary([item1, item2], a => a.name);
            } catch (e) {
                error = e;
            }

            expect(error).not.toBeNull();
            expect(error.message).toEqual('Duplicate key found: NAME');
        });
    });

    describe('reverse', () => {
        it('reverses collection', () => {
            const input = [1, 2, 3];

            const result = reverse(input);

            expect(result).toEqual([3, 2, 1]);
        });

        it('reverses empty collection', () => {
            const input: any[] = [];

            const result = reverse(input);

            expect(result).toEqual([]);
        });
    });

    describe('take', () => {
        it('given empty collection', () => {
            const result = take([], 2);

            expect(result).toEqual([]);
        });

        it('given request for 0 items', () => {
            const result: string[] = take([ "a", "b" ], 0);

            expect(result).toEqual([]);
        });

        it('given count is greater than length', () => {
            const result: string[] = take([ "a", "b" ], 5);

            expect(result).toEqual([ "a", "b" ]);
        });

        it('given count is negative', () => {
            const result: string[] = take([ "a", "b" ], -2);

            expect(result).toEqual([]);
        });

        it('given count is less than number of items', () => {
            const result: string[] = take([ "a", "b" ], 1);

            expect(result).toEqual([ "a" ]);
        });
    });

    describe('skip', () => {
        it('given empty collection', () => {
            const result = skip([], 2);

            expect(result).toEqual([]);
        });

        it('given request to skip 0 items', () => {
            const result: string[] = skip([ "a", "b" ], 0);

            expect(result).toEqual([ "a", "b" ]);
        });

        it('given count is greater than length', () => {
            const result: string[] = skip([ "a", "b" ], 5);

            expect(result).toEqual([]);
        });

        it('given count is negative', () => {
            const result: string[] = skip([ "a", "b" ], -2);

            expect(result).toEqual([ "a", "b" ]);
        });

        it('given count is less than number of items', () => {
            const result: string[] = skip([ "a", "b" ], 1);

            expect(result).toEqual([ "b" ]);
        });
    });
});