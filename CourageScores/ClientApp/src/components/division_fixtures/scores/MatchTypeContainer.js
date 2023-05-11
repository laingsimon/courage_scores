import { createContext, useContext } from "react";
const MatchTypeContext = createContext({});

export function useMatchType() {
    return useContext(MatchTypeContext);
}

/* istanbul ignore next */
export function MatchTypeContainer({ children, ...data }) {
    return (<MatchTypeContext.Provider value={data}>
        {children}
    </MatchTypeContext.Provider>)
}