export interface IFilter<T> {
    apply: (item: T) => boolean;
}
