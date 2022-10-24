import React, {Component} from 'react';
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {Account} from "../api/account";

export class Home extends Component {
    constructor(props) {
        super(props);
        this.settings = new Settings();
        this.accountApi = new Account(new Http(this.settings));
        this.state = {
            user: null,
            loading: true
        }
    }

    async componentDidMount() {
        let details = await this.accountApi.account();
        this.setState({ user: details, loading: false });
    }

    render() {
        return (
            <div>
                <h2>CourageScores</h2>
                {this.state.loading
                    ? 'Loading details...'
                    : this.renderDetails()}
            </div>
        );
    }

    renderDetails() {
        if (this.state.user) {
            return (<p title={this.state.user.name}>Hello <a href={`mailto:${this.state.user.emailAddress}`}>{this.state.user.givenName}</a></p>);
        }

        return (<a href={`${this.settings.apiHost}/api/Account/Login`}>Login with Google</a>);
    }
}
