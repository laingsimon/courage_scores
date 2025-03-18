export function isEqual<T>(x: T, y: T): boolean {
    const xKeys = Object.keys(x || {}).sort((a, b) => a.localeCompare(b));
    const yKeys = Object.keys(y || {}).sort((a, b) => a.localeCompare(b));

    if ((xKeys.length === 0 && yKeys.length === 0) || typeof x === "string" || typeof y === "string") {
        // primitive type
        return x === y;
    }

    if (xKeys.join(',') !== yKeys.join(',')) {
        return false;
    }

    for (const key of xKeys) {
        const xValue = x[key];
        const yValue = y[key];

        if (!isEqual(xValue, yValue)) {
            return false;
        }
    }

    return true;
}