// noinspection JSUnresolvedReference

import { isDateEqualTo, isInFuture, isInPast, isToday } from './dates';

describe('dates', () => {
    const today = date(0);
    const future = date(1);
    const past = date(-1);

    function date(monthOffset: number) {
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

    describe('isDateEqualTo', () => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        it('returns false for yesterday', () => {
            expect(isDateEqualTo(today.toDateString(), -1)).toEqual(false);
        });

        it('returns true for yesterday', () => {
            expect(isDateEqualTo(yesterday.toDateString(), -1)).toEqual(true);
        });

        it('returns false for a future date', () => {
            expect(isDateEqualTo(tomorrow.toDateString(), -1)).toEqual(false);
        });
    });
});
