import {createContext, useContext} from "react";
import {LiveContainer} from "../LiveContainer";

const TournamentContext = createContext({});

export function useTournament() {
    return useContext(TournamentContext);
}

/* istanbul ignore next */
export function TournamentContainer({children, tournamentData, setTournamentData, season, division, alreadyPlaying,
                                        allPlayers, saveTournament, setWarnBeforeSave, matchOptionDefaults, liveOptions}) {
    const data = {
        tournamentData, setTournamentData,
        season, division, alreadyPlaying,
        allPlayers, saveTournament, setWarnBeforeSave, matchOptionDefaults,
    };

    return (<LiveContainer liveOptions={liveOptions} onDataUpdate={setTournamentData}>
        <TournamentContext.Provider value={data}>
            {children}
        </TournamentContext.Provider>
    </LiveContainer>)
}