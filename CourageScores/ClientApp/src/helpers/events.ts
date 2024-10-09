/*
* Change a property of a state-object based on on event
* */
import {Dispatch, SetStateAction} from "react";
import {UntypedPromise} from "../interfaces/UntypedPromise";

export function valueChanged<T>(get: T, set: Dispatch<SetStateAction<T>> | ((value: T) => UntypedPromise), nullIf?: string) {
    return async (event: any) => {
        const newData: any = Object.assign({}, get);
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
    const setProp = (prop: string, value: any) => {
        const newData: any = Object.assign({}, get);
        newData[prop] = value;
        set(newData);
        return newData;
    };

    if (prop) {
        return (value: any) => setProp(prop, value);
    }

    return setProp;
}

/*
* Set a state property based on an input changing
* */
export function stateChanged<T>(set: Dispatch<SetStateAction<T>>) {
    return (event: any) => {
        const target: any = event.target;
        const value = target.type === 'checkbox'
            ? target.checked
            : target.value;

        set(value);
    }
}

/* An event handler that will invoke a function with the name of the element and its value */
export function handleChange(handler?: (name: string, value: any) => UntypedPromise) {
    if (!handler) {
        // prevent updates
        return () => false;
    }

    return async (event: any) => {
        const target: any = event.target;
        const value = target.type === 'checkbox'
            ? target.checked
            : target.value;

        await handler(target.name, value);
    };
}
