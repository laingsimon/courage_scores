import {useDependencies} from "./components/common/IocContainer";
import React, {useEffect, useState} from "react";
import {DataMap, toMap} from "./helpers/collections";
import {Layout} from "./components/layout/Layout";
import {Route, Routes} from "react-router-dom";
import {Home} from "./components/Home";
import {Division} from "./components/league/Division";
import {Score} from "./components/scores/Score";
import {AdminHome} from "./components/admin/AdminHome";
import {Tournament} from "./components/tournaments/Tournament";
import {Practice} from "./components/practice/Practice";
import {AppContainer} from "./components/common/AppContainer";
import {About} from "./components/About";
import {mapError, mapForLogging} from "./helpers/errors";
import {getBuild} from "./helpers/build";
import {LiveSayg} from "./components/sayg/LiveSayg";
import {IApp} from "./components/common/IApp";
import {DivisionDto} from "./interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "./interfaces/models/dtos/Season/SeasonDto";
import {TeamDto} from "./interfaces/models/dtos/Team/TeamDto";
import {UserDto} from "./interfaces/models/dtos/Identity/UserDto";

export interface IAppProps {
    embed: boolean;
    controls: boolean;
    testRoute?: React.ReactNode;
}

export function App({embed, controls, testRoute}: IAppProps) {
    const {divisionApi, accountApi, seasonApi, teamApi, errorApi, settings, parentHeight} = useDependencies();
    const [account, setAccount] = useState<UserDto | null>(null);
    const [divisions, setDivisions] = useState<DataMap<DivisionDto>>(toMap([]));
    const [seasons, setSeasons] = useState<DataMap<SeasonDto>>(toMap([]));
    const [teams, setTeams] = useState<DataMap<TeamDto>>(toMap([]));
    const [appLoading, setAppLoading] = useState<boolean | null>(null);
    const [error, setError] = useState<any | null>(null);

    useEffect(() => {
            // should only fire on componentDidMount
            document.body.className = embed ? 'embed' : 'darts-background';

            // noinspection JSIgnoredPromiseFromCall
            reloadAll();
        },
        // eslint-disable-next-line
        []);

    useEffect(() => {
        // should only fire once (on page load)
        parentHeight.setupInterval();
    });

    function onError(error: any) {
        console.error(error);
        setError(mapError(error));
    }

    async function clearError() {
        setError(null);
    }

    async function invalidateCacheAndTryAgain() {
        settings.invalidateCacheOnNextRequest = true;
        await clearError();
    }

    async function reloadAll() {
        /* istanbul ignore next */
        if (appLoading) {
            /* istanbul ignore next */
            return;
        }

        setAppLoading(true);
        await reloadAccount();
        await reloadDivisions();
        await reloadSeasons();
        await reloadTeams();
        setAppLoading(false);
    }

    async function reloadDivisions() {
        const divisions = toMap(await divisionApi.getAll());
        setDivisions(divisions);
    }

    async function reloadSeasons() {
        const seasons = toMap(await seasonApi.getAll());
        setSeasons(seasons);
    }

    async function reloadTeams() {
        const teams = toMap(await teamApi.getAll());
        setTeams(teams);
    }

    async function reloadAccount() {
        const account = await accountApi.account();
        setAccount(account);
    }

    async function reportClientSideException(error: any) {
        await errorApi.add(mapForLogging(error, account));
    }

    // noinspection JSUnusedGlobalSymbols
    const appData: IApp = {
        divisions,
        seasons,
        teams,
        account,
        error,
        appLoading: appLoading === null ? true : appLoading,
        embed,
        controls,
        reloadDivisions,
        reloadAccount,
        reloadAll,
        reloadTeams,
        reloadSeasons,
        onError,
        clearError,
        invalidateCacheAndTryAgain,
        build: getBuild(),
        reportClientSideException,
    };

    try {
        return (<AppContainer {...appData}>
            <Layout>
                <Routes>
                    <Route path='/' element={<Home/>}/>
                    <Route path='/division/:divisionId' element={<Division/>}/>
                    <Route path='/division/:divisionId/:mode' element={<Division/>}/>
                    <Route path='/division/:divisionId/:mode/:seasonId' element={<Division/>}/>
                    <Route path='/score/:fixtureId' element={<Score/>}/>
                    <Route path='/admin' element={<AdminHome/>}/>
                    <Route path='/admin/:mode' element={<AdminHome/>}/>
                    <Route path='/tournament/:tournamentId' element={<Tournament/>}/>
                    <Route path='/practice' element={<Practice/>}/>
                    <Route path='/about' element={<About/>}/>
                    <Route path='/live/match/:id' element={<LiveSayg />}/>
                    {testRoute}
                </Routes>
            </Layout>
        </AppContainer>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
        return (<AppContainer {...appData}>
            <span>Error</span>
        </AppContainer>);
    }
}