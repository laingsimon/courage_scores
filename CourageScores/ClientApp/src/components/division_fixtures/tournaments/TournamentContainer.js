import {createContext, useContext} from "react";

const TournamentContext = createContext({});

export function useTournament() {
    return useContext(TournamentContext);
}

/* istanbul ignore next */
export function TournamentContainer({children, ...data}) {
    return (<TournamentContext.Provider value={data}>
        {children}
    </TournamentContext.Provider>)
}