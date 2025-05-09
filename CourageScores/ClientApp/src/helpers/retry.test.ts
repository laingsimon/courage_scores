import {retry} from "./retry";
import {noop} from "./tests";

describe('retry', () => {
    let response: boolean;
    let prompts: string[];

    beforeEach(() => {
        window.confirm = (message?: string) => {
            prompts.push(message!);
            return response;
        }
        prompts = [];
        response = true;
        console.error = noop;
    });

    function throwForNAttempts<T>(attempts: number, finalValue: T): () => Promise<T | undefined> {
        let attempt = 1;
        return async () => {
            try {
                if (attempt < attempts) {
                    throw new Error('Some error');
                }

                return finalValue;
            } finally {
                attempt++;
            }
        }
    }

    it('returns value if successful on first attempt', async () => {
        const result = await retry(async () => {
            return 'success';
        }, 'retry prompt');

        expect(result).toEqual('success');
        expect(prompts).toEqual([]);
    });

    it('returns value if successful on second attempt', async () => {
        response = true;

        const result = await retry(
            throwForNAttempts(2, 'success'),
            'retry prompt');

        expect(result).toEqual('success');
        expect(prompts).toEqual(['retry prompt']);
    });

    it('returns default value if user opts not to continue', async () => {
        response = false;

        const result = await retry(
            throwForNAttempts(2, 'success'),
            'retry prompt',
            3,
            'default value');

        expect(result).toEqual('default value');
        expect(prompts).toEqual(['retry prompt']);
    });

    it('returns default value if all attempts fail', async () => {
        response = true;

        const result = await retry(
            throwForNAttempts(5, 'success'),
            'retry prompt',
            3,
            'default value');

        expect(result).toEqual('default value');
        expect(prompts).toEqual(['retry prompt', 'retry prompt', 'retry prompt']);
    });
});