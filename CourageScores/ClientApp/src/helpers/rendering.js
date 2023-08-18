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