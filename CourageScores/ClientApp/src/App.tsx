import {useDependencies} from "./IocContainer";
import React, {useEffect, useState} from "react";
import {DataMap, toMap} from "./helpers/collections";
import {Layout} from "./components/layout/Layout";
import {Route, Routes} from "react-router-dom";
import {Home} from "./components/Home";
import {Division} from "./components/Division";
import {Score} from "./components/division_fixtures/scores/Score";
import {AdminHome} from "./components/admin/AdminHome";
import {Tournament} from "./components/division_fixtures/tournaments/Tournament";
import {Practice} from "./components/Practice";
import {AppContainer} from "./AppContainer";
import {About} from "./components/About";
import {mapError, mapForLogging} from "./helpers/errors";
import {getBuild} from "./helpers/build";
import {LiveSayg} from "./components/division_fixtures/sayg/LiveSayg";
import {IApp} from "./interfaces/IApp";
import {IDivisionDto} from "./interfaces/models/dtos/IDivisionDto";
import {ISeasonDto} from "./interfaces/models/dtos/Season/ISeasonDto";
import {ITeamDto} from "./interfaces/models/dtos/Team/ITeamDto";
import {IUserDto} from "./interfaces/models/dtos/Identity/IUserDto";

export interface IAppProps {
    embed: boolean;
    controls: boolean;
    testRoute?: React.ReactNode;
}

export function App({embed, controls, testRoute}: IAppProps) {
    const {divisionApi, accountApi, seasonApi, teamApi, errorApi, settings, parentHeight} = useDependencies();
    const [account, setAccount] = useState<IUserDto | null>(null);
    const [divisions, setDivisions] = useState<DataMap<IDivisionDto>>(toMap([]));
    const [seasons, setSeasons] = useState<DataMap<ISeasonDto>>(toMap([]));
    const [teams, setTeams] = useState<DataMap<ITeamDto>>(toMap([]));
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