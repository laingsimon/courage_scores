// noinspection JSUnresolvedReference

import {mapError, mapForLogging} from "./errors";
import {noop} from "./tests";

describe('errors', () => {
    describe('mapError', () => {
        const oldConsoleError = console.error;

        beforeEach(() => {
            console.error = noop;
        })

        afterEach(() => {
            console.error = oldConsoleError;
        })

        it('returns stack if provided', () => {
            const result = mapError({message: 'MESSAGE', stack: 'STACK'});

            expect(result.message).toEqual('MESSAGE');
            expect(result.stack).toEqual('STACK');
        });

        it('returns message only if text', () => {
            const result = mapError('MESSAGE');

            expect(result.message).toEqual('MESSAGE');
            expect(result.stack).toBeUndefined();
        });
    });

    describe('mapForLogging', () => {
        it('maps basic properties', () => {
            const account = {name: 'NAME'};
            const result = mapForLogging({message: 'MESSAGE', stack: 'FRAME1\nFRAME2', type: 'TYPE'}, account);
            const today = new Date().toISOString();

            expect(result.source).toEqual('UI');
            expect(result.time).toContain(today.substring(0, 10));
            expect(result.message).toEqual('MESSAGE');
            expect(result.stack).toEqual(['FRAME1', 'FRAME2']);
            expect(result.type).toEqual('TYPE');
            expect(result.userName).toEqual('NAME');
            expect(result.userAgent).not.toBeNull();
            expect(result.url).not.toBeNull();
        });

        it('accepts null stack', () => {
            const account = {name: 'NAME'};
            const result = mapForLogging({message: 'MESSAGE', type: 'TYPE'}, account);

            expect(result.stack).toBeNull();
        });

        it('accepts logged out user', () => {
            const account = null;
            const result = mapForLogging({message: 'MESSAGE', stack: 'FRAME1\nFRAME2', type: 'TYPE'}, account);

            expect(result.userName).toBeNull();
        });

        it('accepts no type', () => {
            const account = {name: 'NAME'};
            const result = mapForLogging({message: 'MESSAGE', stack: 'FRAME1\nFRAME2'}, account);

            expect(result.type).toBeNull();
        });
    });
});