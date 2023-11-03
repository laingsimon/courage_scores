import {createContext, useContext} from "react";
import {LiveContainer} from "../LiveContainer";
import {useApp} from "../../../AppContainer";

const TournamentContext = createContext({});

export function useTournament() {
    return useContext(TournamentContext);
}

/* istanbul ignore next */
export function TournamentContainer({children, tournamentData, setTournamentData, season, division, alreadyPlaying,
                                        allPlayers, saveTournament, setWarnBeforeSave, matchOptionDefaults, enableLive,
                                        livePermitted, webSocket, setWebSocket}) {
    const {account} = useApp();
    const loggedIn = account && account.access && account.access.manageTournaments;
    const data = {
        tournamentData, setTournamentData,
        season, division, alreadyPlaying,
        allPlayers, saveTournament, setWarnBeforeSave, matchOptionDefaults,
    };

    return (<LiveContainer id={tournamentData ? tournamentData.id : null}
                           enabledAtStartup={enableLive && tournamentData && tournamentData.id && !loggedIn}
                           onDataUpdate={setTournamentData}
                           webSocket={webSocket}
                           setWebSocket={setWebSocket}
                           permitted={livePermitted}>
        <TournamentContext.Provider value={data}>
            {children}
        </TournamentContext.Provider>
    </LiveContainer>)
}