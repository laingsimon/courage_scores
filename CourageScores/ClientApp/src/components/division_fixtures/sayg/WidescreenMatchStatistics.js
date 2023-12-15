import {useState} from "react";
import {useSayg} from "./SaygLoadingContainer";
import {useLive} from "../LiveContainer";
import {RefreshControl} from "../RefreshControl";
import {WidescreenSaygPlayer} from "./WidescreenSaygPlayer";
import {WidescreenSaygPlayerStatistic} from "./WidescreenSaygPlayerStatistic";
import {WidescreenSaygPlayerHeading} from "./WidescreenSaygPlayerHeading";
import {WidescreenSaygMatchDetails} from "./WidescreenSaygMatchDetails";

export function WidescreenMatchStatistics({legs, homeScore, awayScore, home, away, singlePlayer, numberOfLegs }) {
    const [oneDartAverage, setOneDartAverage] = useState(false);
    const {sayg} = useSayg();
    const {liveOptions} = useLive();
    const finished = (homeScore >= numberOfLegs / 2.0) || (awayScore >= numberOfLegs / 2.0);

    return (<div className="d-flex flex-row position-absolute top-0 left-0 right-0 bottom-0 p-3 bg-white">
        {liveOptions.canSubscribe && !finished
            ? (<div className="position-absolute"><RefreshControl id={sayg.id}/></div>)
            : null}
        <div datatype="home-column" className="d-flex flex-column flex-grow-1 flex-shrink-1 flex-basis-0">
            <WidescreenSaygPlayerHeading name={home} score={homeScore}/>
            <WidescreenSaygPlayer player="home" legs={legs}/>
            <WidescreenSaygPlayerStatistic player="home" legs={legs} oneDartAverage={oneDartAverage} setOneDartAverage={setOneDartAverage} />
            <WidescreenSaygMatchDetails numberOfLegs={numberOfLegs} legs={legs} />
        </div>
        {singlePlayer ? null : (<>
            <div datatype="separator-column" className="d-flex flex-column">
                <div className="d-flex flex-row width-10 flex-grow-1 justify-content-center">
                    <div className="d-flex flex-row border-solid border-1 border-end-0"></div>
                </div>
            </div>
            <div datatype="away-column" className="d-flex flex-column flex-grow-1 flex-shrink-1 flex-basis-0">
                <WidescreenSaygPlayerHeading name={away} score={awayScore} scoreFirst={true}/>
                <WidescreenSaygPlayer player="away" legs={legs} scoreFirst={true}/>
                <WidescreenSaygPlayerStatistic player="away" legs={legs} oneDartAverage={oneDartAverage} setOneDartAverage={setOneDartAverage} />
                <WidescreenSaygMatchDetails numberOfLegs={numberOfLegs} legs={legs} />
            </div>
        </>)}
    </div>);
}