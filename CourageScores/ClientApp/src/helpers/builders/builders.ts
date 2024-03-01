/* istanbul ignore file */

export interface IBuilder<T> {
    build: () => T;
}

export interface IAddableBuilder<T> extends IBuilder<T> {
    addTo: (map: { [key: string]: T }) => IBuilder<T>;
}

