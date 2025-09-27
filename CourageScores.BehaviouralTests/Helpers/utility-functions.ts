export async function retry<T>(
    func: () => Promise<T>,
    maxAttempts?: number,
    delay?: number,
    abort?: () => boolean): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts || 10; attempt++) {
        try {
            if (abort && abort()) {
                return;
            }

            return await func();
        } catch (e) {
            if (abort && abort()) {
                return;
            }

            if (attempt == maxAttempts) {
                throw new Error(`Failed after after ${attempt}: ${e.message || e}`);
            }

            await new Promise((resolve) => window.setTimeout(resolve, delay || 500));
        }
    }
}
