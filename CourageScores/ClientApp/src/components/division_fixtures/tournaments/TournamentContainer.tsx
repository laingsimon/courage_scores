import React, {createContext, useContext} from "react";
import {LiveContainer} from "../LiveContainer";
import {ITournament} from "../../../interfaces/ITournament";
import {ILiveOptions} from "../../../interfaces/ILiveOptions";

const TournamentContext = createContext({});

export function useTournament(): ITournament {
    return useContext(TournamentContext) as ITournament;
}

export interface ITournamentContainerProps extends ITournament {
    children?: React.ReactNode;
    liveOptions?: ILiveOptions;
}

/* istanbul ignore next */
export function TournamentContainer({children, tournamentData, setTournamentData, season, division, alreadyPlaying,
                                        allPlayers, saveTournament, setWarnBeforeSave, matchOptionDefaults, liveOptions}: ITournamentContainerProps) {
    const data: ITournament = {
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