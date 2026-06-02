import type { Config } from 'jest';
import { createJsWithTsPreset } from 'ts-jest';

const presetConfig = createJsWithTsPreset({});

export default {
    ...presetConfig,
    testEnvironment: 'jest-environment-jsdom',
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    maxWorkers: '50%',
    coverageReporters: ['lcov'],
    moduleNameMapper: {
        '\\.(css|less)$': '<rootDir>/src/__mocks__/style-mock.js',
        '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$':
            '<rootDir>/src/__mocks__/file-mock.js',
    },
    collectCoverageFrom: [
        '!src/index.tsx',
        '!src/tests/**/*.ts',
        '!coverage/**/*.js',
        '!dist/**/*.*',
        '!src/interfaces/apis/**/*.ts',
        '!src/interfaces/models/**/*.ts',
    ],
    setupFiles: ['<rootDir>/setup.jest.js'],
} satisfies Config;
