export function isInPast(date: string) {
    const today = new Date(new Date().toDateString());
    return new Date(date) < today;
}

export function isInFuture(date: string) {
    const today = new Date(new Date().toDateString());
    const tomorrow = new Date(today.setDate(today.getDate() + 1));
    return new Date(date) >= tomorrow;
}

export function isToday(date: string) {
    return isDateEqualTo(date, 0);
}

export function isDateEqualTo(date: string, dayOffset?: number) {
    const relative = new Date();
    if (dayOffset) {
        relative.setDate(relative.getDate() + dayOffset);
    }

    return relative.toDateString() === new Date(date).toDateString();
}