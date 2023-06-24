import {useApp} from "../../../../AppContainer";

export function MatchReport({ tournamentData, fixture }) {
    const { onError } = useApp();

    try {
        return (<div className="page-break-after">MATCH REPORT</div>);
    } catch (e) {
        onError(e);
    }
}