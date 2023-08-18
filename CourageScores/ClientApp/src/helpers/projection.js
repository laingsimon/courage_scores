/*
* Create a pseudo-random GUID
* */
export function createTemporaryId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        // eslint-disable-next-line
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/*
* Create a collection of items, containing the given number of items, provided by the given function
* */
export function repeat(times, itemProvider) {
    const items = [];
    for (let index = 0; index < times; index++) {
        items.push(itemProvider ? itemProvider(index) : index);
    }
    return items;
}

export const EMPTY_ID = '00000000-0000-0000-0000-000000000000';

/*
* Determine if the given id is a compatible GUID
* */
export function isGuid(id) {
    if (!id) {
        return false;
    }

    return !!id.match(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/);
}