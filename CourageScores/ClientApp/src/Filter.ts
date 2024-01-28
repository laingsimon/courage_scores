import {all, any} from "./helpers/collections";
import {IFilter} from "./interfaces/IFilter";

export class Filter<T> implements IFilter<T> {
    _expression: (item: T) => any;

    constructor(expression: (item: T) => boolean) {
        if (!expression) {
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
        if (!filters) {
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
        if (!filters) {
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
        if (!filter) {
            throw new Error('Filter not supplied');
        }

        this._filter = filter;
    }

    apply(item: T) {
        return !this._filter.apply(item);
    }
}

export class NullFilter<T> implements IFilter<T> {
    apply(_?: T) {
        return true;
    }
}