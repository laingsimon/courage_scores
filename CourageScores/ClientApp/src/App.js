import React, {Component} from 'react';
import {Route, Routes} from 'react-router-dom';
import {Layout} from './components/layout/Layout';
import './custom.css';
import {Home} from "./components/Home";
import {Division} from "./components/Division";
import {Settings} from "./api/settings";
import {Http} from "./api/http";
import {AccountApi} from "./api/account";
import {DivisionApi} from "./api/division";
import {Score} from "./components/division_fixtures/scores/Score";
import {Tournament} from "./components/division_fixtures/tournaments/Tournament";
import {toMap} from "./Utilities";
import {AdminHome} from "./components/admin/AdminHome";
import {SeasonApi} from "./api/season";
import {SelfScore} from "./components/SelfScore";
import {IocContainer} from "./Dependencies";

export default class App extends Component {
    constructor(props) {
        super(props);

        this.http = new Http(new Settings());
        this.divisionApi = new DivisionApi(this.http);
        this.accountApi = new AccountApi(this.http);
        this.seasonApi = new SeasonApi(this.http);
        this.reloadDivisions = this.reloadDivisions.bind(this);
        this.reloadSeasons = this.reloadSeasons.bind(this);
        this.reloadAccount = this.reloadAccount.bind(this);
        this.reloadAll = this.reloadAll.bind(this);
        this.clearError = this.clearError.bind(this);

        this.state = {
            appLoading: true,
            subProps: {
                divisions: [],
                seasons: [],
                account: null,
                divisionData: {}
            },
            error: null
        };
    }

    shouldExcludeSurround() {
        return window.excludeSurround;
    }

    static getDerivedStateFromError(error) {
        return {
            error: {
                message: error.message,
                stack: error.stack,
            },
        };
    }

    clearError() {
        this.setState({
            error: null
        });
    }

    async componentDidMount() {
        await this.reloadAll();
    }

    async reloadAll() {
        this.setState({
            appLoading: false,
            subProps: {
                account: await this.reloadAccount(),
                divisions: await this.reloadDivisions(),
                seasons: await this.reloadSeasons()
            }
        });
    }

    async reloadDivisions() {
        const subProps = Object.assign(
            {},
            this.state.subProps);
        subProps.divisions = toMap(await this.divisionApi.getAll());

        this.setState({
            subProps: subProps
        });
        return subProps.divisions;
    }

    async reloadSeasons() {
        const subProps = Object.assign(
            {},
            this.state.subProps);
        subProps.seasons = toMap(await this.seasonApi.getAll());

        this.setState({
            subProps: subProps
        });
        return subProps.seasons;
    }

    async reloadAccount() {
        const subProps = Object.assign(
            {},
            this.state.subProps);
        subProps.account = await this.accountApi.account();

        this.setState({
            subProps: subProps
        });
        return subProps.account;
    }

    render() {
        const dependencies = {
            ...this.state.subProps
        };

        return (
            <IocContainer {...dependencies} >
                <Layout excludeSurround={this.shouldExcludeSurround()} appLoading={this.state.appLoading} {...this.combineProps({...this.props})} error={this.state.error} clearError={this.clearError}>
                    <Routes>
                        <Route exact path='/' element={<Home {...this.combineProps({...this.props})} />} />
                        <Route path='/division/:divisionId' element={<Division {...this.combineProps({...this.props})} />} />}/>
                        <Route path='/division/:divisionId/:mode' element={<Division {...this.combineProps({...this.props})} />} />}/>
                        <Route path='/division/:divisionId/:mode/:seasonId' element={<Division {...this.combineProps({...this.props})} />} />}/>
                        <Route path='/score/:fixtureId' element={<Score {...this.combineProps({...this.props})} />} />}/>
                        <Route path='/admin' element={<AdminHome {...this.combineProps({...this.props})} />} />}/>
                        <Route path='/admin/:mode' element={<AdminHome {...this.combineProps({...this.props})} />} />}/>
                        <Route path='/tournament/:tournamentId' element={<Tournament {...this.combineProps({...this.props})} />} />}/>
                        <Route path='/sayg/' element={<SelfScore {...this.combineProps({...this.props})} />} />}/>
                    </Routes>
                </Layout>
            </IocContainer>
        );
    }

    combineProps(props) {
        return Object.assign(props, this.state.subProps, { apis: {
            reloadDivisions: this.reloadDivisions,
            reloadAccount: this.reloadAccount,
            reloadDivision: this.reloadDivision,
            reloadAll: this.reloadAll
        }, appLoading: this.state.appLoading });
    }
}
