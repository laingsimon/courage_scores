import {all, any} from "./helpers/collections";

export class Filter {
    _expression;
    constructor(expression) {
        if (!expression) {
            throw new Error('Expression not supplied');
        }

        this._expression = expression;
    }

    apply(item) {
        return !!this._expression(item);
    }
}

export class AndFilter {
    _filters;
    constructor(filters) {
        if (!filters) {
            throw new Error('Filters not supplied');
        }
        this._filters = filters;
    }

    apply(item) {
        return all(this._filters, filter => filter.apply(item));
    }
}

export class OrFilter {
    _filters;
    constructor(filters) {
        if (!filters) {
            throw new Error('Filters not supplied');
        }

        this._filters = filters;
    }

    apply(item) {
        return any(this._filters, filter => filter.apply(item));
    }
}

export class NotFilter {
    _filter;
    constructor(filter) {
        if (!filter) {
            throw new Error('Filter not supplied');
        }

        this._filter = filter;
    }

    apply(item) {
        return !this._filter.apply(item);
    }
}

export class NullFilter {
    apply() {
        return true;
    }
}