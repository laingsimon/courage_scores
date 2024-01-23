import React, {createContext, useContext} from "react";
import {IMatchType} from "../../../interfaces/IMatchType";

const MatchTypeContext = createContext({});

export function useMatchType(): IMatchType {
    return useContext(MatchTypeContext) as IMatchType;
}

export interface IMatchTypeContainerProps extends IMatchType {
    children?: React.ReactNode;
}

/* istanbul ignore next */
export function MatchTypeContainer({children, ...data}: IMatchTypeContainerProps) {
    return (<MatchTypeContext.Provider value={data}>
        {children}
    </MatchTypeContext.Provider>)
}