import React, {createContext, useContext} from "react";
import {IDivisionData} from "../interfaces/IDivisionData";

const DivisionDataContext = createContext({});

export function useDivisionData(): IDivisionData {
    return useContext(DivisionDataContext) as IDivisionData;
}

export interface IDivisionDataContainerProps extends IDivisionData {
    children?: React.ReactNode;
}

/* istanbul ignore next */
export function DivisionDataContainer({children, ...data}: IDivisionDataContainerProps) {
    return (<DivisionDataContext.Provider value={data}>
        {children}
    </DivisionDataContext.Provider>)
}