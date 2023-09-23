/*
* Convert an array of items to a dictionary, keyed on the id property of each item
* */
export function toMap(items) {
    const map = {
        map: items.map.bind(items),
        length: items.length,
        sort: items.sort.bind(items),
        filter: items.filter.bind(items),
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
export function sortBy(property, descending) {
    function getValue(item, property) {
        if (property.indexOf('.') !== -1) {
            const parentProperty = property.substring(0, property.indexOf('.'));
            const childProperty = property.substring(parentProperty.length + 1);
            const parent = getValue(item, parentProperty);
            return getValue(parent, childProperty);
        }

        const value = item[property];
        if (value && value.toLowerCase) {
            return value.toLowerCase();
        }

        return value;
    }

    return function nameSort(x, y) {
        if (getValue(x, property) === getValue(y, property)) {
            return 0;
        }

        return (getValue(x, property) > getValue(y, property))
            ? descending ? -1 : 1
            : descending ? 1 : -1;
    }
}


/*
* Return true if there are any items (that match the optional predicate)
* */
export function any(iterable, predicate) {
    return count(iterable, predicate) > 0;
}

/*
* Return true if all of the items are true (or match the optional predicate)
* */
export function all(iterable, predicate) {
    return count(iterable, predicate) === iterable.length;
}

/*
* Return true if there are no items (that match the optional predicate)
* */
export function isEmpty(iterable, predicate) {
    return count(iterable, predicate) === 0;
}

/*
* Return the number of items (that match the optional predicate)
* */
export function count(iterable, predicate) {
    return iterable.filter(predicate || (_ => true)).length;
}

/*
* Return the sum of the given items (using the optional selector)
* */
export function sum(iterable, selector) {
    return iterable.reduce((prev, current) => prev + (selector ? selector(current) : current), 0);
}

/*
* Return the value of the item that is greater than all others (using the optional selector)
* */
export function max(iterable, selector) {
    return iterable.reduce((prev, current) => {
        const currentValue = selector ? selector(current) : current;
        return currentValue > prev
            ? currentValue
            : prev;
    }, 0);
}

/*
* Return the item at the given index (using the optional selector)
* */
export function elementAt(items, index, selector) {
    if (items.length > index && items[index]) {
        return selector ? selector(items[index]) : items[index];
    }

    return null;
}

/*
* Reduce the given items to have only one with the given property value
* */
export function distinct(items, property) {
    function getValue(item, property) {
        if (!property) {
            return item;
        }

        if (property.indexOf('.') !== -1) {
            const parentProperty = property.substring(0, property.indexOf('.'));
            const childProperty = property.substring(parentProperty.length + 1);
            const parent = getValue(item, parentProperty);
            return getValue(parent, childProperty);
        }

        const value = item[property];
        if (value && value.toLowerCase) {
            return value.toLowerCase();
        }

        return value;
    }

    const map = {};

    items.forEach(item => {
        const key = getValue(item, property);
        if (!map[key]) {
            map[key] = item;
        }
    });

    return Object.values(map);
}

/*
* Produce a map of items keyed on the given selector
* */
export function toDictionary(items, keySelector, valueSelector) {
    const dict = {};

    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const key = keySelector(item);
        if (dict[key]) {
            throw new Error('Duplicate key found: ' + key);
        }

        dict[key] = valueSelector ? valueSelector(item) : item;
    }

    return dict;
}