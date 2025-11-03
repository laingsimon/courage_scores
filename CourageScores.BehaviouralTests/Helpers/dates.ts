function pad2Digits(num: number) {
    return `${num < 10 ? '0' : ''}${num}`;
}

export function formatDate(date: Date) {
    return `${date.getFullYear()}-${pad2Digits(date.getMonth() + 1)}-${pad2Digits(date.getDate())}`;
}

export function now() {
    return new Date();
}

export function today() {
    const date = now();

    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function tomorrow() {
    const date = today();
    date.setDate(date.getDate() + 1);
    return date;
}
