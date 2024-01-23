import {all, any} from "./helpers/collections";
import {IFilter} from "./interfaces/IFilter";

export class Filter implements IFilter {
    _expression: (item: any) => boolean | undefined;

    constructor(expression: (item: any) => boolean) {
        if (!expression) {
            throw new Error('Expression not supplied');
        }

        this._expression = expression;
    }

    apply(item: any) {
        return !!this._expression(item);
    }
}

export class AndFilter implements IFilter {
    _filters: IFilter[];

    constructor(filters: IFilter[]) {
        if (!filters) {
            throw new Error('Filters not supplied');
        }
        this._filters = filters;
    }

    apply(item: any) {
        return all(this._filters, filter => filter.apply(item));
    }
}

export class OrFilter implements IFilter {
    _filters: IFilter[];

    constructor(filters: IFilter[]) {
        if (!filters) {
            throw new Error('Filters not supplied');
        }

        this._filters = filters;
    }

    apply(item: any) {
        return any(this._filters, filter => filter.apply(item));
    }
}

export class NotFilter implements IFilter {
    _filter: IFilter;

    constructor(filter: IFilter) {
        if (!filter) {
            throw new Error('Filter not supplied');
        }

        this._filter = filter;
    }

    apply(item: any) {
        return !this._filter.apply(item);
    }
}

export class NullFilter implements IFilter {
    apply(_?: any) {
        return true;
    }
}