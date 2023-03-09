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
import {SelfScore} from "./components/SelfScore";
import {AppContainer} from "./AppContainer";

export function App() {
    const { divisionApi, accountApi, seasonApi } = useDependencies();
    const [ account, setAccount ] = useState(null);
    const [ divisions, setDivisions ] = useState(toMap([]));
    const [ seasons, setSeasons ] = useState(toMap([]));
    const [ appLoading, setAppLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        // should only fire on componentDidMount

        // noinspection JSIgnoredPromiseFromCall
        reloadAll();
    },
    // eslint-disable-next-line
    []);

    function onError(error) {
        setError({ message: error.message, stack: error.stack });
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

    async function reloadAccount() {
        const account = await accountApi.account();
        setAccount(account);
    }

    function shouldExcludeSurround() {
        return window.excludeSurround;
    }

    const subProps = {
        divisions,
        seasons,
        account,
        error,
        appLoading,
        reloadDivisions: reloadDivisions,
        reloadAccount: reloadAccount,
        reloadAll: reloadAll,
        onError: onError,
        clearError: clearError
    };

    try {
        return (<AppContainer {...subProps}>
            <Layout excludeSurround={shouldExcludeSurround()}>
                <Routes>
                    <Route exact path='/' element={<Home />} />
                    <Route path='/division/:divisionId' element={<Division />} />}/>
                    <Route path='/division/:divisionId/:mode' element={<Division />} />}/>
                    <Route path='/division/:divisionId/:mode/:seasonId' element={<Division />} />}/>
                    <Route path='/score/:fixtureId' element={<Score />} />}/>
                    <Route path='/admin' element={<AdminHome />} />}/>
                    <Route path='/admin/:mode' element={<AdminHome />} />}/>
                    <Route path='/tournament/:tournamentId' element={<Tournament />} />}/>
                    <Route path='/sayg/' element={<SelfScore />} />}/>
                </Routes>
            </Layout>
        </AppContainer>);
    } catch (e) {
        setError({
            message: e.message,
            stack: e.stack
        })
    }
}