import { createContext, useContext } from "react";
const LeagueFixtureContext = createContext({});

export function useLeagueFixture() {
    return useContext(LeagueFixtureContext);
}

/* istanbul ignore next */
export function LeagueFixtureContainer({ children, ...data }) {
    return (<LeagueFixtureContext.Provider value={data}>
        {children}
    </LeagueFixtureContext.Provider>)
}