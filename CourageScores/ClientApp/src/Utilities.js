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

export function sortBy(property) {
    function getValue(item) {
        return item[property];
    }

    return function nameSort(x, y) {
        if (getValue(x).toLowerCase() === getValue(y).toLowerCase()) {
            return 0;
        }

        return (getValue(x).toLowerCase() > getValue(y).toLowerCase())
            ? 1
            : -1;
    }
}

export function createTemporaryId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random()*16|0;
        // eslint-disable-next-line
        const v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}