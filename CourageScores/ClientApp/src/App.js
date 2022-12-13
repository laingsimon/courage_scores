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
import {UserAdmin} from "./components/admin/UserAdmin";
import {NewSeason} from "./components/admin/NewSeason";
import {Knockout} from "./components/division_fixtures/knockouts/Knockout";
import {toMap} from "./Utilities";
import {ExportData} from "./components/admin/ExportData";
import {ImportData} from "./components/admin/ImportData";

export default class App extends Component {
    constructor(props) {
        super(props);

        this.settings = new Settings();
        this.divisionApi = new DivisionApi(new Http(this.settings));
        this.accountApi = new AccountApi(new Http(this.settings));
        this.reloadDivisions = this.reloadDivisions.bind(this);
        this.reloadAccount = this.reloadAccount.bind(this);
        this.reloadAll = this.reloadAll.bind(this);
        this.clearError = this.clearError.bind(this);

        this.state = {
            appLoading: true,
            subProps: {
                divisions: [],
                account: null,
                divisionData: {}
            },
            error: null
        };
    }

    static getDerivedStateFromError(error) {
        return {
            error: {
                message: error.message
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
        return (
            <Layout {...this.combineProps({...this.props})} error={this.state.error} clearError={this.clearError}>
                <Routes>
                    <Route exact path='/' element={<Home {...this.combineProps({...this.props})} />} />
                    <Route path='/division/:divisionId' element={<Division {...this.combineProps({...this.props})} />} />}/>
                    <Route path='/division/:divisionId/:mode' element={<Division {...this.combineProps({...this.props})} />} />}/>
                    <Route path='/division/:divisionId/:mode/:seasonId' element={<Division {...this.combineProps({...this.props})} />} />}/>
                    <Route path='/score/:fixtureId' element={<Score {...this.combineProps({...this.props})} />} />}/>
                    <Route path='/userAdmin' element={<UserAdmin {...this.combineProps({...this.props})} />} />}/>
                    <Route path='/dataAdmin/export' element={<ExportData {...this.combineProps({...this.props})} />} />}/>
                    <Route path='/dataAdmin/import' element={<ImportData {...this.combineProps({...this.props})} />} />}/>
                    <Route path='/season/new' element={<NewSeason {...this.combineProps({...this.props})} />} />}/>
                    <Route path='/knockout/:knockoutId' element={<Knockout {...this.combineProps({...this.props})} />} />}/>
                </Routes>
            </Layout>
        );
    }

    combineProps(props) {
        return Object.assign(props, this.state.subProps, { apis: {
            reloadDivisions: this.reloadDivisions,
            reloadAccount: this.reloadAccount,
            reloadDivision: this.reloadDivision,
            reloadAll: this.reloadAll
        } });
    }
}
