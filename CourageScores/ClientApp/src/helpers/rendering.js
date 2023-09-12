/*
* Round a number to 2 decimal places
* */
export function round2dp(number) {
    return Math.round(number * 100) / 100;
}

/*
* Render a date in dd-MMM format
* */
export function renderDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(
        'en-GB',
        {month: "short", day: "numeric"});
}

/*
* Return the given value if a number, otherwise the alternative value
* */
export function ifNaN(value, valueIfNaN) {
    if (Number.isNaN(value) || value === null || value === undefined) {
        return valueIfNaN;
    }

    return value;
}