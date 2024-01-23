import React, {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useApp} from "../AppContainer";
import {SaygLoadingContainer} from "./division_fixtures/sayg/SaygLoadingContainer";
import {EditSaygPracticeOptions} from "./EditSaygPracticeOptions";
import {Loading} from "./common/Loading";
import {IRecordedScoreAsYouGoDto} from "../interfaces/serverSide/Game/Sayg/IRecordedScoreAsYouGoDto";
import {ILiveOptions} from "../interfaces/ILiveOptions";

interface IPracticeScoreAsYouGoDto extends IRecordedScoreAsYouGoDto {
    loaded: boolean;
}

export function Practice() {
    const {onError, account, appLoading} = useApp();
    const [dataError, setDataError] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const hasHash = location.hash && location.hash !== '#';

    if (appLoading) {
        return (<Loading/>);
    }

    const defaultSaygData: IPracticeScoreAsYouGoDto = {
        yourName: account ? account.givenName : 'you',
        opponentName: null,
        homeScore: 0,
        awayScore: 0,
        numberOfLegs: 3,
        startingScore: 501,
        legs: {},
        loaded: false,
    };

    async function clearError() {
        navigate('/practice');
        setDataError(null);
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
                onSaved={async (data) => {
                    if (location.hash !== `#${data.id}`) {
                        navigate(`/practice#${data.id}`);
                    }
                }}
                liveOptions={liveOptions}
                onLoadError={async (error: string) => setDataError(error)}>
                <EditSaygPracticeOptions/>
            </SaygLoadingContainer>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}