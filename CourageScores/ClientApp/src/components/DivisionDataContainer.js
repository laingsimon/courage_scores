import { createContext, useContext } from "react";
const DivisionDataContext = createContext({});

export function useDivisionData() {
    return useContext(DivisionDataContext);
}

/* istanbul ignore next */
export function DivisionDataContainer({ children, ...data }) {
    return (<DivisionDataContext.Provider value={data}>
        {children}
    </DivisionDataContext.Provider>)
}