export async function retry<T>(action: () => Promise<T>, message: string, times: number = 10, defaultValue?: T): Promise<T | undefined> {
    for (let attempt = 1; attempt <= times; attempt++) {
        try {
            return await action();
        } catch (e) {
            console.error(e);
            if (!window.confirm(message)) {
                return defaultValue;
            }
        }
    }

    return defaultValue;
}