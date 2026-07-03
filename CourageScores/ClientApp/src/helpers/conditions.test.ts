import { hasAccess, hasAllAccess, hasAnyAccess } from './conditions.ts';
import { AccessOption } from '../interfaces/models/dtos/Identity/AccessOption.ts';

describe('conditions', () => {
    const userTemplate = {
        name: 'name',
        emailAddress: 'simon@email.com',
        givenName: 'name',
    };

    describe('hasAccess', () => {
        it('returns false when not logged in', () => {
            const result = hasAccess(undefined, AccessOption.manageAccess);

            expect(result).toBe(false);
        });

        it('returns false when access levels is null', () => {
            const result = hasAccess(userTemplate, AccessOption.manageAccess);

            expect(result).toBe(false);
        });

        it('returns false when access levels does not contain access', () => {
            const result = hasAccess(
                {
                    ...userTemplate,
                    accessLevels: {},
                },
                AccessOption.manageAccess,
            );

            expect(result).toBe(false);
        });

        it('returns false when access levels does not contain access', () => {
            const result = hasAccess(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: undefined!,
                    },
                },
                AccessOption.manageAccess,
            );

            expect(result).toBe(false);
        });

        it('returns true when access levels contains non-null access', () => {
            const result = hasAccess(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                    },
                },
                AccessOption.manageAccess,
            );

            expect(result).toBe(true);
        });
    });

    describe('hasAnyAccess', () => {
        it('returns false when no options provided', () => {
            const result = hasAnyAccess({
                ...userTemplate,
                accessLevels: {
                    [AccessOption.manageAccess]: {},
                },
            });

            expect(result).toBe(false);
        });

        it('returns false when no option is not defined', () => {
            const result = hasAnyAccess(
                {
                    ...userTemplate,
                    accessLevels: {},
                },
                AccessOption.manageAccess,
            );

            expect(result).toBe(false);
        });

        it('returns true when option is defined', () => {
            const result = hasAnyAccess(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                    },
                },
                AccessOption.manageAccess,
            );

            expect(result).toBe(true);
        });

        it('returns true when either option is defined', () => {
            const result = hasAnyAccess(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                    },
                },
                AccessOption.manageAccess,
                AccessOption.manageDivisions,
            );

            expect(result).toBe(true);
        });
    });

    describe('hasAllAccess', () => {
        it('returns false when no options provided', () => {
            const result = hasAllAccess({
                ...userTemplate,
                accessLevels: {
                    [AccessOption.manageAccess]: {},
                },
            });

            expect(result).toBe(false);
        });

        it('returns false when no option is not defined', () => {
            const result = hasAllAccess(
                {
                    ...userTemplate,
                    accessLevels: {},
                },
                AccessOption.manageAccess,
            );

            expect(result).toBe(false);
        });

        it('returns false when one option is not defined', () => {
            const result = hasAllAccess(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                    },
                },
                AccessOption.manageAccess,
                AccessOption.manageDivisions,
            );

            expect(result).toBe(false);
        });

        it('returns true when all options are defined', () => {
            const result = hasAllAccess(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                        [AccessOption.manageDivisions]: {},
                    },
                },
                AccessOption.manageAccess,
                AccessOption.manageDivisions,
            );

            expect(result).toBe(true);
        });
    });
});
