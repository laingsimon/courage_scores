// noinspection JSUnresolvedReference

import React from "react";
import { round2dp, renderDate } from './rendering';

describe('rendering', () => {
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

    describe('renderDate', () => {
        it('should render the date correctly', () => {
            const result = renderDate('2023-02-03T00:00:00');

            expect(result).toEqual('3 Feb');
        });
    });
});