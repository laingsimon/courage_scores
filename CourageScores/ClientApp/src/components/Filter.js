export class Filter {
    _expression;
    constructor(expression) {
        if (!expression) {
            throw new Error('Expression not supplied');
        }

        this._expression = expression;
    }

    apply(item) {
        return this._expression(item);
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
        for (let index = 0; index < this._filters.length; index++) {
            const filter = this._filters[index];
            if (!filter.apply(item)) {
                return false;
            }
        }

        return true;
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
        for (let index = 0; index < this._filters.length; index++) {
            const filter = this._filters[index];
            if (filter.apply(item)) {
                return true;
            }
        }

        return false;
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