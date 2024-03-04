export type StringMapObject = {[key: string] : any};
export interface DataMap<T> extends StringMapObject {
    map<V>(mapper: (value: T, index: number, array: T[]) => V, thisArg?: any): V[];
    length: number;
    sort(sorter: (x: T, y: T) => number): T[];
    filter(predicate: (item: T) => boolean): T[];
}

/*
* Convert an array of items to a dictionary, keyed on the id property of each item
* */
export function toMap<T>(items: T[]): DataMap<T> {
    const theMap: DataMap<T> = {
        map: items.map.bind(items),
        length: items.length,
        sort: items.sort.bind(items),
        filter: items.filter.bind(items),
    };
    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        theMap[(item as any).id] = item;
    }
    return theMap;
}

/*
* Sort any array by the given property
* */
export function sortBy(property: string, descending?: boolean): (a: any, b: any) => number {
    function getValue(item: any, property: string): object {
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

    return function nameSort(x: object, y: object): 0 | 1 | -1 {
        if (getValue(x, property) === getValue(y, property)) {
            return 0;
        }

        return (getValue(x, property) > getValue(y, property))
            ? descending ? -1 : 1
            : descending ? 1 : -1;
    }
}

export interface IFrequency {
    occurrences: number;
}

/*
* Group items in a collections by the given property and return them in order of occurrences, descending
* */
export function groupAndSortByOccurrences<T>(items: T[], property: string): (T & IFrequency)[] {
    const oneEightyMap: { [id: string]: number } = {};
    const itemLookup: { [id: string]: T } = {};

    items.forEach((item: T) => {
        const id = item[property];

        if (oneEightyMap[id]) {
            oneEightyMap[id]++;
        } else {
            oneEightyMap[id] = 1;
            itemLookup[id] = item;
        }
    });

    return Object.keys(oneEightyMap).sort((aId: string, bId: string) => {
        if (oneEightyMap[aId] > oneEightyMap[bId]) {
            return -1;
        }
        if (oneEightyMap[aId] < oneEightyMap[bId]) {
            return 1;
        }

        // they have the same frequency, so sort by name instead
        if (aId < bId) {
            return -1;
        }
        if (aId > bId) {
            return 1;
        }

        return 0;
    }).map((id: string): T & IFrequency => {
        const occurrences: number = oneEightyMap[id];
        const item: T = itemLookup[id];

        return Object.assign({ occurrences }, item);
    });
}

/*
* Return true if there are any items (that match the optional predicate)
* */
export function any<T>(iterable: T[] | DataMap<T>, predicate?: (a: T) => boolean): boolean {
    return count(iterable, predicate) > 0;
}

/*
* Return true if all of the items are true (or match the optional predicate)
* */
export function all<T>(iterable: T[] | DataMap<T>, predicate?: (a: T) => boolean): boolean {
    return count(iterable, predicate) === iterable.length;
}

/*
* Return true if there are no items (that match the optional predicate)
* */
export function isEmpty<T>(iterable: T[] | DataMap<T>, predicate?: (a: T) => boolean): boolean {
    return count(iterable, predicate) === 0;
}

/*
* Return the number of items (that match the optional predicate)
* */
export function count<T>(iterable: T[] | DataMap<T>, predicate?: (a: T, index?: number) => boolean): number {
    return iterable.filter(predicate || (_ => true)).length;
}

/*
* Return the sum of the given items (using the optional selector)
* */
export function sum<T>(iterable: T[], selector?: (a: T) => number): number {
    return iterable.reduce((prev: number, current: T) => {
        const next: any = (selector ? selector(current) : current);
        return prev + next;
    }, 0);
}

/*
* Return the value of the item that is greater than all others (using the optional selector)
* */
export function max<T>(iterable: T[], selector?: (a: T) => number): number {
    return iterable.reduce((prev: number, current: T) => {
        const currentValue: any = selector ? selector(current) : current;
        return currentValue > prev
            ? currentValue
            : prev;
    }, 0);
}

/*
* Return the item at the given index (using the optional selector)
* */
export function elementAt<T>(items: T[], index: number, selector?: (a: T) => any): any {
    if (items.length > index && items[index]) {
        return selector ? selector(items[index]) : items[index];
    }

    return null;
}

/*
* Reduce the given items to have only one with the given property value
* */
export function distinct(items: any[], property?: string): any[] {
    function getValue(item: any, property: string | undefined): any {
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

    const map: StringMapObject = {};

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
export function toDictionary<T>(items: T[], keySelector: ((a: T) => string), valueSelector?: (a: T) => any): StringMapObject {
    const dict: StringMapObject = {};

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

/*
* Reverse a collection of items
* */
export function reverse<T>(items: T[]): T[] {
    const backwards: T[] = [];
    for (let index = items.length -1; index >= 0; index--) {
        backwards.push(items[index]);
    }

    return backwards;
}