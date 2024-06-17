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
export function TournamentContainer(props: ITournamentContainerProps) {
    const data: ITournamentContainerProps = Object.assign({}, props);
    // remove any props that are for this container alone (and shouldn't be passed down)
    delete data.children;
    delete data.liveOptions;

    return (<LiveContainer liveOptions={props.liveOptions} onDataUpdate={props.setTournamentData}>
        <TournamentContext.Provider value={data}>
            {props.children}
        </TournamentContext.Provider>
    </LiveContainer>)
}