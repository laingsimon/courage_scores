import {all, any} from "../../helpers/collections";
import {IFilter} from "./IFilter";

export class Filter<T> implements IFilter<T> {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    _expression: (item: T) => any;

    constructor(expression: (item: T) => boolean) {
        /* istanbul ignore next */
        if (!expression) {
            /* istanbul ignore next */
            throw new Error('Expression not supplied');
        }

        this._expression = expression;
    }

    apply(item: T) {
        return !!this._expression(item);
    }
}

export class AndFilter<T> implements IFilter<T> {
    _filters: IFilter<T>[];

    constructor(filters: IFilter<T>[]) {
        /* istanbul ignore next */
        if (!filters) {
            /* istanbul ignore next */
            throw new Error('Filters not supplied');
        }
        this._filters = filters;
    }

    apply(item: T) {
        return all(this._filters, filter => filter.apply(item));
    }
}

export class OrFilter<T> implements IFilter<T> {
    _filters: IFilter<T>[];

    constructor(filters: IFilter<T>[]) {
        /* istanbul ignore next */
        if (!filters) {
            /* istanbul ignore next */
            throw new Error('Filters not supplied');
        }

        this._filters = filters;
    }

    apply(item: T) {
        return any(this._filters, filter => filter.apply(item));
    }
}

export class NotFilter<T> implements IFilter<T> {
    _filter: IFilter<T>;

    constructor(filter: IFilter<T>) {
        /* istanbul ignore next */
        if (!filter) {
            /* istanbul ignore next */
            throw new Error('Filter not supplied');
        }

        this._filter = filter;
    }

    apply(item: T) {
        return !this._filter.apply(item);
    }
}

export class NullFilter<T> implements IFilter<T> {
    apply() {
        return true;
    }
}