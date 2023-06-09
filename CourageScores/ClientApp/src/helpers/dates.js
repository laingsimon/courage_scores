export function isInPast(date) {
    const today = new Date(new Date().toDateString());
    return new Date(date) < today;
}

export function isInFuture(date) {
    const today = new Date(new Date().toDateString());
    const tomorrow = new Date(today.setDate(today.getDate() + 1));
    return new Date(date) >= tomorrow;
}

export function isToday(date) {
    const today = new Date().toDateString();
    return today === new Date(date).toDateString();
}