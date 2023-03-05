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
    function getValue(item) {
        return item[property];
    }

    return function nameSort(x, y) {
        if (getValue(x).toLowerCase() === getValue(y).toLowerCase()) {
            return 0;
        }

        return (getValue(x).toLowerCase() > getValue(y).toLowerCase())
            ? descending ? -1 : 1
            : descending ? 1 : -1;
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
export function valueChanged(get, set, nullIf) {
    return async (event) => {
        const newData = Object.assign({}, get);
        newData[event.target.name] = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value === nullIf
                ? null
                : event.target.value;
        await set(newData);
    }
}

/*
* Change a property of a state-object.
* 1: Provide the property name, function taking the value as an input is returned
* 2: Exclude the property name, function taking the property name and value is returned
*
* Returned function will return the newly set data
* */
export function propChanged(get, set, prop) {
    const setProp = (prop, value) => {
        const newData = Object.assign({}, get);
        newData[prop] = value;
        set(newData);
        return newData;
    };

    if (prop) {
        return (value) => setProp(prop, value);
    }

    return setProp;
}

/*
* Set a state property based on an input changing
* */
export function stateChanged(set) {
    return (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;

        set(value);
    }
}

/*
* Return true if there are any items (that match the optional predicate)
* */
export function any(iterable, predicate) {
    return count(iterable, predicate || (_ => true)) > 0;
}

/*
* Return true if all of the items are true (or match the optional predicate)
* */
export function all(iterable, predicate) {
    return count(iterable, predicate || (item => item)) === iterable.length;
}

/*
* Return true if there are no items (that match the optional predicate)
* */
export function isEmpty(iterable, predicate) {
    return count(iterable, predicate || (_ => true)) === 0;
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
* Round a number to 2 decimal places
* */
export function round2dp(number) {
    return Math.round(number * 100) / 100;
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
* Create a collection of items, containing the given number of items, provided by the given function
* */
export function repeat(times, itemProvider) {
    const items = [];
    for (let index = 0; index < times; index++) {
        items.push(itemProvider(index));
    }
    return items;
}