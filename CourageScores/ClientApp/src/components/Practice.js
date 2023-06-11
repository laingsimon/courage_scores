import React from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useApp} from "../AppContainer";
import {SaygLoadingContainer} from "./division_fixtures/sayg/SaygLoadingContainer";
import {EditSaygPracticeOptions} from "./EditSaygPracticeOptions";
import {Loading} from "./common/Loading";

export function Practice() {
    const { onError, account, appLoading } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const hasHash = location.hash && location.hash !== '#';

    if (appLoading) {
        return (<Loading />);
    }

    const defaultSaygData = {
        yourName: account ? account.givenName : 'you',
        opponentName: null,
        homeScore: 0,
        awayScore: 0,
        numberOfLegs: 3,
        startingScore: 501,
        legs: {},
        loaded: false,
    };

    try {
        return (<SaygLoadingContainer
            id={hasHash ?  location.hash.substring(1) : null}
            on180={() => {}}
            onHiCheck={() => {}}
            defaultData={defaultSaygData}
            autoSave={false}
            onScoreChange={() => {}}
            onSaved={(data) => {
                if (location.hash !== `#${data.id}`) {
                    navigate(`/practice#${data.id}`);
                }
            }}>
            <EditSaygPracticeOptions />
        </SaygLoadingContainer>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}