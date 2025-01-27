/*
* Round a number to 2 decimal places
* */
export function round2dp(number: number): number {
    return Math.round(number * 100) / 100;
}

/*
* Render a date in dd-MMM format
* */
export function renderDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(
        'en-GB',
        {month: "short", day: "numeric"});
}

/*
* Return the given value if a number, otherwise the alternative value
* */
export function ifNaN(value?: number | null, valueIfNaN?: string): string | number {
    if (Number.isNaN(value) || value === null || value === undefined) {
        return valueIfNaN || '';
    }

    return value;
}

/*
* Return the default value if the value is undefined
* */
export function ifUndefined(value?: number, valueIfUndefined?: number): number {
    return value === undefined
        ? (valueIfUndefined || 0)
        : value;
}