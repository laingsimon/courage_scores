import {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useApp} from "../common/AppContainer";
import {ILoadedScoreAsYouGoDto, SaygLoadingContainer} from "../sayg/SaygLoadingContainer";
import {EditSaygPracticeOptions} from "./EditSaygPracticeOptions";
import {Loading} from "../common/Loading";
import {ILiveOptions} from "../../live/ILiveOptions";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";

interface IPracticeScoreAsYouGoDto extends UpdateRecordedScoreAsYouGoDto {
    loaded: boolean;
}

export function Practice() {
    const {onError, account, appLoading} = useApp();
    const [dataError, setDataError] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const hasHash: boolean = location.hash && location.hash !== '#';
    const query: URLSearchParams = new URLSearchParams(location.search);

    if (appLoading) {
        return (<Loading/>);
    }

    function getInteger(key: string): number {
        const value = query.get(key);
        return value ? Number.parseInt(value) : null;
    }

    const defaultSaygData: IPracticeScoreAsYouGoDto = {
        yourName: query.get('yourName') || (account ? account.givenName : 'you'),
        opponentName: query.get('opponentName'),
        homeScore: 0,
        awayScore: 0,
        numberOfLegs: getInteger('numberOfLegs') || 3,
        startingScore: getInteger('startingScore') || 501,
        legs: {},
        loaded: false,
    };

    async function clearError() {
        setDataError(null);
        navigate('/practice');
    }

    async function noop() {
        // do nothing
    }

    try {
        if (dataError) {
            return (<div className="p-3 border-danger border-1 border" data-name="data-error">
                <h3>⚠ Error with shared data</h3>
                <p>{dataError}</p>
                <button className="btn btn-primary" onClick={clearError}>Clear</button>
            </div>);
        }

        const liveOptions: ILiveOptions = {
            publish: false,
            canSubscribe: false,
            subscribeAtStartup: [],
        }

        return (<div className="p-3 content-background">
            <SaygLoadingContainer
                id={hasHash ? location.hash.substring(1) : null}
                on180={noop}
                onHiCheck={noop}
                defaultData={defaultSaygData}
                autoSave={false}
                onSaved={async (data: ILoadedScoreAsYouGoDto) => {
                    if (location.hash !== `#${data.id}`) {
                        navigate(`/practice#${data.id}`);
                    }
                }}
                liveOptions={liveOptions}
                onLoadError={async (error: string) => setDataError(error)}>
                <EditSaygPracticeOptions />
            </SaygLoadingContainer>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}