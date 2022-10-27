import React, {Component} from 'react';
import {Route, Routes} from 'react-router-dom';
import {Layout} from './components/Layout';
import './custom.css';
import {Home} from "./components/Home";
import {Division} from "./components/Division";
import {Settings} from "./api/settings";
import {Http} from "./api/http";
import {AccountApi} from "./api/account";
import {DivisionApi} from "./api/division";

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            appLoading: true,
            subProps: {
                divisions: [],
                account: null,
            },
        };

        this.settings = new Settings();
        this.divisionApi = new DivisionApi(new Http(this.settings));
        this.accountApi = new AccountApi(new Http(this.settings));
        this.reloadDivisions = this.reloadDivisions.bind(this);
        this.reloadAccount = this.reloadAccount.bind(this);
    }

    async componentDidMount() {
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
        subProps.divisions = this.toMap(await this.divisionApi.getAll());

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
            <Layout {...this.combineProps({...this.props})}>
                <Routes>
                    <Route exact path='/' element={<Home {...this.combineProps({...this.props})} />} />
                    <Route path='/division/:divisionId' element={<Division {...this.combineProps({...this.props})} />} />}/>
                </Routes>
            </Layout>
        );
    }

    combineProps(props) {
        return Object.assign(props, this.state.subProps);
    }

    toMap(items) {
        const map = {
            map: items.map.bind(items),
            length: items.length,
        };
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            map[item.id] = item;
        }
        return map;
    }
}
