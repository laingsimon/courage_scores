export function toMap(items) {
    const map = {
        map: items.map.bind(items),
        length: items.length,
    };
    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        map[item.id] = item;
    }
    return map;
}

export function nameSort(x, y) {
    if (x.name.toLowerCase() === y.name.toLowerCase()) {
        return 0;
    }

    return (x.name.toLowerCase() > y.name.toLowerCase())
        ? 1
        : -1;
}
