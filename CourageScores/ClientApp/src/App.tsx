import { useDependencies } from './components/common/IocContainer';
import React, { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Route, Routes } from 'react-router';
import { Home } from './components/Home';
import { Score } from './components/scores/Score';
import { AdminHome } from './components/admin/AdminHome';
import { Tournament } from './components/tournaments/Tournament';
import { PracticeMatch } from './components/practice/PracticeMatch';
import { AppContainer } from './components/common/AppContainer';
import { About } from './components/About';
import { mapError, mapForLogging } from './helpers/errors';
import { getBuild } from './helpers/build';
import { LiveSayg } from './components/sayg/LiveSayg';
import { IApp } from './components/common/IApp';
import { DivisionDto } from './interfaces/models/dtos/DivisionDto';
import { SeasonDto } from './interfaces/models/dtos/Season/SeasonDto';
import { TeamDto } from './interfaces/models/dtos/Team/TeamDto';
import { UserDto } from './interfaces/models/dtos/Identity/UserDto';
import { Tv } from './components/Tv';
import { IBrowserType } from './components/common/IBrowserType';
import { PreferencesContainer } from './components/common/PreferencesContainer';
import {
    DivisionUriContainer,
    UrlStyle,
} from './components/league/DivisionUriContainer';
import { Division } from './components/league/Division';
import { IError } from './components/common/IError';
import { IFullScreen } from './components/common/IFullScreen';
import { AnalyseScores } from './components/analysis/AnalyseScores';

export interface IAppProps {
    embed?: boolean;
    controls?: boolean;
    testRoute?: React.ReactNode;
}

export function App({ embed, controls, testRoute }: IAppProps) {
    const {
        divisionApi,
        accountApi,
        seasonApi,
        teamApi,
        errorApi,
        settings,
        parentHeight,
    } = useDependencies();
    const [account, setAccount] = useState<UserDto | undefined>(undefined);
    const [divisions, setDivisions] = useState<DivisionDto[]>([]);
    const [seasons, setSeasons] = useState<SeasonDto[]>([]);
    const [teams, setTeams] = useState<TeamDto[]>([]);
    const [appLoading, setAppLoading] = useState<boolean | null>(null);
    const [error, setError] = useState<IError | undefined>(undefined);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(
        document.fullscreenElement != null,
    ); // intentional single equals to cover the undefined case

    useEffect(
        () => {
            // should only fire on componentDidMount
            document.body.className = embed ? 'embed' : 'darts-background';

            // noinspection JSIgnoredPromiseFromCall
            reloadAll();
        },
        // eslint-disable-next-line
        [],
    );

    useEffect(() => {
        // should only fire once (on page load)
        parentHeight.setupInterval();
    });

    useEffect(() => {
        function onFullScreenChange() {
            setIsFullScreen(document.fullscreenElement !== null);
        }

        addEventListener('fullscreenchange', onFullScreenChange);

        return () => {
            removeEventListener('fullscreenchange', onFullScreenChange);
        };
    });

    function onError(error: string | IError) {
        console.error(error);
        setError(mapError(error));
    }

    async function clearError() {
        setError(undefined);
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
        const divisions = await divisionApi.getAll();
        setDivisions(divisions);
    }

    async function reloadSeasons() {
        const seasons = await seasonApi.getAll();
        setSeasons(seasons);
    }

    async function reloadTeams() {
        const teams = await teamApi.getAll();
        setTeams(teams);
    }

    async function reloadAccount() {
        const account = await accountApi.account();
        setAccount(account || undefined);
    }

    async function reportClientSideException(error: IError) {
        await errorApi.add(mapForLogging(error, account || undefined));
    }

    const browser: IBrowserType = {
        mobile:
            window.navigator.userAgent.indexOf(' Mobile ') !== -1 ||
            window.location.search.indexOf('mobile') !== -1,
        tv:
            window.navigator.userAgent.indexOf(' TV ') !== -1 ||
            window.location.search.indexOf('tv') !== -1,
    };

    const fullScreen: IFullScreen = {
        isFullScreen,
        canGoFullScreen: document.fullscreenEnabled,
        async enterFullScreen(element?: HTMLElement | null): Promise<void> {
            if (document.fullscreenEnabled) {
                await (element ?? document.body).requestFullscreen();
            }
        },
        async exitFullScreen(): Promise<void> {
            if (isFullScreen) {
                await document.exitFullscreen();
            }
        },
        async toggleFullScreen(): Promise<void> {
            if (isFullScreen) {
                await this.exitFullScreen();
                return;
            }

            await this.enterFullScreen();
        },
    };
    fullScreen.exitFullScreen = fullScreen.exitFullScreen.bind(fullScreen);
    fullScreen.enterFullScreen = fullScreen.enterFullScreen.bind(fullScreen);
    fullScreen.toggleFullScreen = fullScreen.toggleFullScreen.bind(fullScreen);

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
        browser,
        fullScreen,
    };

    try {
        return (
            <AppContainer {...appData}>
                <PreferencesContainer>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route
                                path="/division/:divisionId"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Single}>
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/division/:divisionId/:mode"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Single}>
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/division/:divisionId/:mode/:seasonId"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Single}>
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/teams/:seasonId"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Multiple}
                                        mode="teams">
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/players/:seasonId"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Multiple}
                                        mode="players">
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/fixtures/:seasonId"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Multiple}
                                        mode="fixtures">
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/teams"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Multiple}
                                        mode="teams">
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/players"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Multiple}
                                        mode="players">
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/fixtures"
                                element={
                                    <DivisionUriContainer
                                        urlStyle={UrlStyle.Multiple}
                                        mode="fixtures">
                                        <Division />
                                    </DivisionUriContainer>
                                }
                            />
                            <Route
                                path="/score/:fixtureId"
                                element={<Score />}
                            />
                            <Route path="/admin" element={<AdminHome />} />
                            <Route
                                path="/admin/:mode"
                                element={<AdminHome />}
                            />
                            <Route
                                path="/tournament/:tournamentId"
                                element={<Tournament />}
                            />
                            <Route
                                path="/practice"
                                element={<PracticeMatch />}
                            />
                            <Route
                                path="/practice/:type"
                                element={<PracticeMatch />}
                            />
                            <Route path="/about" element={<About />} />
                            <Route path="/live/:type" element={<LiveSayg />} />
                            <Route path="/live" element={<LiveSayg />} />
                            <Route path="/tv" element={<Tv />} />
                            <Route
                                path="/analyse/:season"
                                element={<AnalyseScores />}
                            />
                            {testRoute}
                        </Routes>
                    </Layout>
                </PreferencesContainer>
            </AppContainer>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e!);
        /* istanbul ignore next */
        return (
            <AppContainer {...appData}>
                <span>Error</span>
            </AppContainer>
        );
    }
}
