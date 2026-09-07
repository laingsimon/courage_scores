import {
    hasAccess,
    hasAccessLevel,
    hasAllAccess,
    hasAllAccessLevels,
    hasAnyAccess,
    hasAnyAccessLevel,
    UserAccessContext,
} from './conditions.ts';
import { AccessOption } from '../interfaces/models/dtos/Identity/AccessOption.ts';
import { user } from './tests.tsx';
import { AccessLevelDto } from '../interfaces/models/dtos/Identity/AccessLevelDto';

describe('conditions', () => {
    const userTemplate = {
        ...user(undefined, undefined, 'name'),
        name: 'name',
        emailAddress: 'simon@email.com',
    };

    describe('hasAccessLevel', () => {
        const seasonId: string = '00000000-0000-0000-0000-111111111111';
        const divisionId: string = '00000000-0000-0000-0000-222222222222';
        const teamId: string = '00000000-0000-0000-0000-333333333333';
        const otherId: string = '00000000-0000-0000-0000-444444444444';
        const granularTestCaseOption: AccessOption =
            AccessOption.analyseMatches;

        interface GranularUserAccessTestCase {
            level: AccessLevelDto;
            context: UserAccessContext;
            expected: boolean;
        }

        const buildGranularUserAccessTestCase = (
            level: AccessLevelDto,
            context: Partial<UserAccessContext>,
            expected?: boolean,
        ): GranularUserAccessTestCase & { toString: () => string } => ({
            level,
            context: { ...context, ...{ option: granularTestCaseOption } },
            expected: expected ?? false,
            toString: () =>
                `${JSON.stringify(level).replaceAll('00000000-0000-0000-0000-', '...-')} + ${JSON.stringify(context).replaceAll('00000000-0000-0000-0000-', '...-')} = ${expected ?? false}`,
        });

        // These are a mirror of the test cases in AccessServiceTests.cs
        const granularUserAccessTestCases: GranularUserAccessTestCase[] = [
            buildGranularUserAccessTestCase(
                { seasonIds: [seasonId] },
                {},
                true,
            ),
            buildGranularUserAccessTestCase(
                { divisionIds: [divisionId] },
                {},
                true,
            ),
            buildGranularUserAccessTestCase({ teamIds: [teamId] }, {}, true),
            buildGranularUserAccessTestCase({}, { seasonId }, true),
            buildGranularUserAccessTestCase({}, { seasonId, divisionId }, true),
            buildGranularUserAccessTestCase(
                {},
                { seasonId, divisionId, teamId },
                true,
            ),
            buildGranularUserAccessTestCase(
                { seasonIds: [seasonId] },
                { seasonId },
                true,
            ),
            buildGranularUserAccessTestCase(
                { divisionIds: [divisionId] },
                { seasonId, divisionId },
                true,
            ),
            buildGranularUserAccessTestCase(
                { teamIds: [teamId] },
                { seasonId, divisionId, teamId },
                true,
            ),
            buildGranularUserAccessTestCase(
                { seasonIds: [seasonId] },
                { seasonId: otherId },
            ),
            buildGranularUserAccessTestCase(
                { divisionIds: [divisionId] },
                { seasonId, divisionId: otherId },
            ),
            buildGranularUserAccessTestCase(
                { teamIds: [teamId] },
                { seasonId, divisionId, teamId: otherId },
            ),
            buildGranularUserAccessTestCase({ seasonIds: [] }, {}),
            buildGranularUserAccessTestCase({ divisionIds: [] }, {}),
            buildGranularUserAccessTestCase({ teamIds: [] }, {}),
        ];

        it('returns false when not logged in', () => {
            const result = hasAccessLevel(undefined, {
                option: AccessOption.manageAccess,
            });

            expect(result).toBe(false);
        });

        it('returns false when access levels is null', () => {
            const result = hasAccessLevel(userTemplate, {
                option: AccessOption.manageAccess,
            });

            expect(result).toBe(false);
        });

        it('returns false when access levels does not contain access', () => {
            const result = hasAccessLevel(
                {
                    ...userTemplate,
                    accessLevels: {},
                },
                { option: AccessOption.manageAccess },
            );

            expect(result).toBe(false);
        });

        it('returns false when access levels does not contain access', () => {
            const result = hasAccessLevel(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: undefined!,
                    },
                },
                { option: AccessOption.manageAccess },
            );

            expect(result).toBe(false);
        });

        it('returns true when access levels contains non-null access', () => {
            const result = hasAccessLevel(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                    },
                },
                { option: AccessOption.manageAccess },
            );

            expect(result).toBe(true);
        });

        // This is a mirror of the test in AccessServiceTests.cs
        it.each(granularUserAccessTestCases)(
            'granularUserTestCase: %s',
            async (testCase: GranularUserAccessTestCase) => {
                const { level, context, expected } = testCase;
                const result = hasAccessLevel(
                    {
                        ...userTemplate,
                        accessLevels: {
                            [granularTestCaseOption]: level,
                        },
                    },
                    context,
                );

                expect(result).toBe(expected);
            },
        );
    });

    describe('hasAnyAccessLevel', () => {
        it('returns false when no options provided', () => {
            const result = hasAnyAccessLevel({
                ...userTemplate,
                accessLevels: {
                    [AccessOption.manageAccess]: {},
                },
            });

            expect(result).toBe(false);
        });

        it('returns false when no option is not defined', () => {
            const result = hasAnyAccessLevel(
                {
                    ...userTemplate,
                    accessLevels: {},
                },
                { option: AccessOption.manageAccess },
            );

            expect(result).toBe(false);
        });

        it('returns true when option is defined', () => {
            const result = hasAnyAccessLevel(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                    },
                },
                { option: AccessOption.manageAccess },
            );

            expect(result).toBe(true);
        });

        it('returns true when either option is defined', () => {
            const result = hasAnyAccessLevel(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                    },
                },
                { option: AccessOption.manageAccess },
                { option: AccessOption.manageDivisions },
            );

            expect(result).toBe(true);
        });
    });

    describe('hasAllAccessLevels', () => {
        it('returns false when no options provided', () => {
            const result = hasAllAccessLevels({
                ...userTemplate,
                accessLevels: {
                    [AccessOption.manageAccess]: {},
                },
            });

            expect(result).toBe(false);
        });

        it('returns false when no option is not defined', () => {
            const result = hasAllAccessLevels(
                {
                    ...userTemplate,
                    accessLevels: {},
                },
                { option: AccessOption.manageAccess },
            );

            expect(result).toBe(false);
        });

        it('returns false when one option is not defined', () => {
            const result = hasAllAccessLevels(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                    },
                },
                { option: AccessOption.manageAccess },
                { option: AccessOption.manageDivisions },
            );

            expect(result).toBe(false);
        });

        it('returns true when all options are defined', () => {
            const result = hasAllAccessLevels(
                {
                    ...userTemplate,
                    accessLevels: {
                        [AccessOption.manageAccess]: {},
                        [AccessOption.manageDivisions]: {},
                    },
                },
                { option: AccessOption.manageAccess },
                { option: AccessOption.manageDivisions },
            );

            expect(result).toBe(true);
        });
    });

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
