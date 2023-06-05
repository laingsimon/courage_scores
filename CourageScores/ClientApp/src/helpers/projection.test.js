// noinspection JSUnresolvedReference

import React from "react";
import { createTemporaryId, repeat } from './projection';

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

            expect(result).toEqual([ 0, 1 ]);
        });

        it('should return array of index', () => {
            const result = repeat(2);

            expect(result).toEqual([ 0, 1 ]);
        });
    });
});