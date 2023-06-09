/*
* Change a property of a state-object based on on event
* */
export function valueChanged(get, set, nullIf) {
    return async (event) => {
        const newData = Object.assign({}, get);
        newData[event.target.name] = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value === nullIf
                ? null
                : event.target.value;
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
export function propChanged(get, set, prop) {
    const setProp = (prop, value) => {
        const newData = Object.assign({}, get);
        newData[prop] = value;
        set(newData);
        return newData;
    };

    if (prop) {
        return (value) => setProp(prop, value);
    }

    return setProp;
}

/*
* Set a state property based on an input changing
* */
export function stateChanged(set) {
    return (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;

        set(value);
    }
}

/* An event handler that will invoke a function with the name of the element and its value */
export function handleChange(handler) {
    if (!handler) {
        // prevent updates
        return () => false;
    }

    return async (event) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;

        await handler(event.target.name, value);
    };
}
