// noinspection JSUnresolvedReference

import {ifNaN, renderDate, round2dp} from './rendering';

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

    describe('ifNaN', () => {
        it('returns given value if 0', () => {
            const result = ifNaN(0, 'nan');

            expect(result).toEqual(0);
        });

        it('returns given value if a positive number', () => {
            const result = ifNaN(123, 'nan');

            expect(result).toEqual(123);
        });

        it('returns given value if a negative number', () => {
            const result = ifNaN(-456, 'nan');

            expect(result).toEqual(-456);
        });

        it('returns nan-value if NaN', () => {
            const result = ifNaN(Number.NaN, 'nan');

            expect(result).toEqual('nan');
        });

        it('returns nan-value if null', () => {
            const result = ifNaN(null, 'nan');

            expect(result).toEqual('nan');
        });

        it('returns nan-value if undefined', () => {
            const result = ifNaN(undefined, 'nan');

            expect(result).toEqual('nan');
        });
    });
});