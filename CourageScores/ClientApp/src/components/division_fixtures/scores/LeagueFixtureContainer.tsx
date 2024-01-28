import React, {createContext, useContext} from "react";
import {ILeagueFixture} from "../../../interfaces/ILeagueFixture";

const LeagueFixtureContext = createContext({});

export function useLeagueFixture(): ILeagueFixture {
    return useContext(LeagueFixtureContext) as ILeagueFixture;
}

export interface ILeagueFixtureContainerProps extends ILeagueFixture {
    children?: React.ReactNode;
}

/* istanbul ignore next */
export function LeagueFixtureContainer({children, ...data}: ILeagueFixtureContainerProps) {
    return (<LeagueFixtureContext.Provider value={data}>
        {children}
    </LeagueFixtureContext.Provider>)
}