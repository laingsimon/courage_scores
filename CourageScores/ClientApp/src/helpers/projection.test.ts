// noinspection JSUnresolvedReference

import {createTemporaryId, isGuid, repeat} from './projection';

describe('projection', () => {
    describe('createTemporaryId', () => {
        it('should create different ids', () => {
            const first = createTemporaryId();
            const second = createTemporaryId();

            expect(second).not.toEqual(first);
        });
    });

    describe('repeat', () => {
        it('should return empty array', () => {
            const result = repeat(0, i => i);

            expect(result).toEqual([]);
        });

        it('should return array of items', () => {
            const result = repeat(2, i => i);

            expect(result).toEqual([0, 1]);
        });

        it('should return array of index', () => {
            const result = repeat(2);

            expect(result).toEqual([0, 1]);
        });
    });

    describe('isGuid', function () {
        it('given null should return false', function () {
            const result = isGuid(null);

            expect(result).toEqual(false);
        });

        it('given empty should return false', function () {
            const result = isGuid('');

            expect(result).toEqual(false);
        });

        it('given uppercase id should return true', function () {
            const result = isGuid(createTemporaryId().toUpperCase());

            expect(result).toEqual(true);
        });

        it('given lowercase id should return true', function () {
            const result = isGuid(createTemporaryId().toLowerCase());

            expect(result).toEqual(true);
        });

        it('given non-id should return false', function () {
            const result = isGuid('anything that is not an id');

            expect(result).toEqual(false);
        });
    });
});