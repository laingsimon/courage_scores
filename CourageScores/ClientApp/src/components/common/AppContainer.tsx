import React, {createContext, useContext} from "react";
import {IApp} from "./IApp";

const AppContext = createContext({});

export function useApp(): IApp {
    return useContext(AppContext) as IApp;
}

export interface IAppContainerProps extends IApp {
    children?: React.ReactNode;
}

/* istanbul ignore next */
export function AppContainer({children, ...data}: IAppContainerProps) {
    return (<AppContext.Provider value={data}>
        {children}
    </AppContext.Provider>)
}