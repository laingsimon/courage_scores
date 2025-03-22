import {isEqual} from "./ObjectComparer";

describe('ObjectComparer', () => {
    describe('isEqual', () => {
        it('when both are null', () => {
            const result = isEqual(null, null);

            expect(result).toEqual(true);
        });

        it('when only first is null', () => {
            const result = isEqual(null, 'something');

            expect(result).toEqual(false);
        });

        it('when only second is null', () => {
            const result = isEqual('something', null);

            expect(result).toEqual(false);
        });

        it('when both are equal primitives', () => {
            const result = isEqual('something', 'something');

            expect(result).toEqual(true);
        });

        it('when both are unequal primitives', () => {
            const result = isEqual('something', 'else');

            expect(result).toEqual(false);
        });

        it('when both are same instance', () => {
            const first = { name: 'Simon' };

            const result = isEqual(first, first);

            expect(result).toEqual(true);
        });

        it('when there are different number of properties', () => {
            const first = { name: 'Simon', age: 40 };
            const second = { name: 'Simon', age: 40, gender: 'Male' };

            const result = isEqual(first, second);

            expect(result).toEqual(false);
        });

        it('when there are the same number of properties with different values', () => {
            const first = { name: 'Simon', age: 40 };
            const second = { name: 'Sarah', age: 45 };

            const result = isEqual(first, second);

            expect(result).toEqual(false);
        });

        it('when when nested values are equal', () => {
            const first = { name: 'Simon', address: { line1: 'LINE 1' } };
            const second = { name: 'Simon', address: { line1: 'LINE 1' } };

            const result = isEqual(first, second);

            expect(result).toEqual(true);
        });

        it('when nested values differ', () => {
            const first = { name: 'Simon', address: { line1: 'LINE 1' } };
            const second = { name: 'Simon', address: { line1: 'LINE 2' } };

            const result = isEqual(first, second);

            expect(result).toEqual(false);
        });

        it('when nested values are null', () => {
            const first = { name: 'Simon', address: null };
            const second = { name: 'Simon', address: null };

            const result = isEqual(first, second);

            expect(result).toEqual(true);
        });

        it('when values are unequal arrays', () => {
            const first = [1, 2];
            const second = [3, 4];

            const result = isEqual(first, second);

            expect(result).toEqual(false);
        });

        it('when values are equal arrays', () => {
            const first = [1, 2];
            const second = [1, 2];

            const result = isEqual(first, second);

            expect(result).toEqual(true);
        });
    });
});