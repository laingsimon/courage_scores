import React, {createContext, useContext} from "react";
import {LiveContainer} from "../../live/LiveContainer";
import {ITournament} from "./ITournament";
import {ILiveOptions} from "../../live/ILiveOptions";

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
                                        allPlayers, saveTournament, setWarnBeforeEditDialogClose, matchOptionDefaults, liveOptions, saving, editTournament, setEditTournament }: ITournamentContainerProps) {
    const data: ITournament = {
        tournamentData, setTournamentData,
        season, division, alreadyPlaying,
        allPlayers, saveTournament, setWarnBeforeEditDialogClose, matchOptionDefaults,
        saving, editTournament, setEditTournament
    };

    return (<LiveContainer liveOptions={liveOptions} onDataUpdate={setTournamentData}>
        <TournamentContext.Provider value={data}>
            {children}
        </TournamentContext.Provider>
    </LiveContainer>)
}