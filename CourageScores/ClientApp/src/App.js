import './custom.css';
import {useDependencies} from "./IocContainer";
import React, {useEffect, useState} from "react";
import {toMap} from "./Utilities";
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
import {getBuild, mapForLogging, mapError} from "./AppHelper";

export function App({ shouldExcludeSurround }) {
    const { divisionApi, accountApi, seasonApi, teamApi, errorApi } = useDependencies();
    const [ account, setAccount ] = useState(null);
    const [ divisions, setDivisions ] = useState(toMap([]));
    const [ seasons, setSeasons ] = useState(toMap([]));
    const [ teams, setTeams ] = useState(toMap([]));
    const [ appLoading, setAppLoading ] = useState(null);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        // should only fire on componentDidMount

        // noinspection JSIgnoredPromiseFromCall
        reloadAll();
    },
    // eslint-disable-next-line
    []);

    function onError(error) {
        console.error(error);
        setError(mapError(error));
    }

    function clearError() {
        setError(null);
    }

    async function reloadAll() {
        if (appLoading) {
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

    async function reportClientSideException(error) {
        await errorApi.add(mapForLogging(error, account));
    }

    // noinspection JSUnusedGlobalSymbols
    const appData = {
        divisions,
        seasons,
        teams,
        account,
        error,
        appLoading: appLoading === null ? true : appLoading,
        excludeSurround: shouldExcludeSurround,
        reloadDivisions,
        reloadAccount,
        reloadAll,
        reloadTeams,
        reloadSeasons,
        onError,
        clearError,
        build: getBuild(),
        reportClientSideException,
    };

    try {
        return (<AppContainer {...appData}>
            <Layout>
                <Routes>
                    <Route exact path='/' element={<Home />} />
                    <Route path='/division/:divisionId' element={<Division />} />
                    <Route path='/division/:divisionId/:mode' element={<Division />} />
                    <Route path='/division/:divisionId/:mode/:seasonId' element={<Division />} />
                    <Route path='/score/:fixtureId' element={<Score />} />
                    <Route path='/admin' element={<AdminHome />} />
                    <Route path='/admin/:mode' element={<AdminHome />} />
                    <Route path='/tournament/:tournamentId' element={<Tournament />} />
                    <Route path='/practice' element={<Practice />} />
                    <Route path='/about' element={<About />} />
                </Routes>
            </Layout>
        </AppContainer>);
    } catch (e) {
        onError(e);
    }
}