/*
* Convert an array of items to a dictionary, keyed on the id property of each item
* */
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

/*
* Sort any array by the given property
* */
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

/*
* Create a pseudo-random GUID
* */
export function createTemporaryId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random()*16|0;
        // eslint-disable-next-line
        const v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

/*
* Change a property of a state-object based on on event
* */
export function valueChanged(get, set) {
    return async (event) => {
        const newData = Object.assign({}, get);
        newData[event.target.name] = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;
        await set(newData);
    }
}