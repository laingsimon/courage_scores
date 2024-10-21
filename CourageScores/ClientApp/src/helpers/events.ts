/*
* Change a property of a state-object based on on event
* */
import {Dispatch, SetStateAction} from "react";
import {UntypedPromise} from "../interfaces/UntypedPromise";

export function valueChanged<T>(get: T, set: Dispatch<SetStateAction<T>> | ((value: T) => UntypedPromise), nullIf?: string) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return async (event: any) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const newData: any = Object.assign({}, get);
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const target: any = event.target;
        newData[target.name] = target.type === 'checkbox'
            ? target.checked
            : target.value === nullIf
                ? null
                : target.type === 'number'
                    ? Number.parseFloat(target.value)
                    : target.value;
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
/* eslint-disable @typescript-eslint/no-explicit-any */
export function propChanged<T>(get: T, set: Dispatch<SetStateAction<T>>, prop?: string): (x: any, y?: any) => UntypedPromise {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const setProp = (prop: string, value: any) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const newData: any = Object.assign({}, get);
        newData[prop] = value;
        set(newData);
        return newData;
    };

    if (prop) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return (value: any) => setProp(prop, value);
    }

    return setProp;
}

/*
* Set a state property based on an input changing
* */
export function stateChanged<T>(set: Dispatch<SetStateAction<T>>) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (event: any) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const target: any = event.target;
        const value = target.type === 'checkbox'
            ? target.checked
            : target.value;

        set(value);
    }
}

/* An event handler that will invoke a function with the name of the element and its value */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function handleChange(handler?: (name: string, value: any) => UntypedPromise) {
    if (!handler) {
        // prevent updates
        return () => false;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return async (event: any) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const target: any = event.target;
        const value = target.type === 'checkbox'
            ? target.checked
            : target.value;

        await handler(target.name, value);
    };
}

/*
* Convert a sync method call (with one parameter) into an async call
* */
export function asyncCallback<T>(sync: (input: T) => void): (input: T) => UntypedPromise {
    /* istanbul ignore next */
    return async (input: T) => sync(input);
}

/*
* Convert a sync method call (with no parameters) into an async call
* */
export function asyncClear<T>(sync: (input?: T) => void): () => UntypedPromise {
    /* istanbul ignore next */
    return async () => sync();
}
