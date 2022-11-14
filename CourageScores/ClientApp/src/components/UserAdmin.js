import React, {useState} from 'react';
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {AccountApi} from "../api/account";

export function UserAdmin() {
    const api = new AccountApi(new Http(new Settings()));
    const [ saving, setSaving ] = useState(false);
    const [ account, setAccount ] = useState({
        emailAddress: '',
        access: {
            userAdmin: false,
            leagueAdmin: false,
            teamAdmin: false,
            gameAdmin: false,
        }
    });

    function valueChanged(event) {
        const currentAccount = Object.assign({}, account);
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;

        let name = event.target.name;
        let dataObject = currentAccount;
        while (name.indexOf('.') !== -1) {
            const prefix = name.substring(0, name.indexOf('.'));
            name = name.substring(prefix.length + 1);
            dataObject = dataObject[prefix];
        }

        dataObject[name] = value;
        setAccount(currentAccount);
    }

    async function saveChanges() {
        if (saving) {
            return;
        }

        if (!account.emailAddress) {
            window.alert('You must enter an email address');
            return;
        }

        setSaving(true);
        try {
            const result = await api.update(account);
            if (result.success) {
                window.alert('Access updated');
            } else {
                console.log(result);
                window.alert('Access could not be updated');
            }
        } finally {
            setSaving(false);
        }
    }

    return (<div className="light-background p-3">
        <h3>User admin</h3>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Email address</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="emailAddress" value={account.emailAddress} onChange={valueChanged}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id="userAdmin"
                       name="access.userAdmin" checked={account.access.userAdmin} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor="userAdmin">User Admin</label>
                <p>
                    Can modify the access other users have within the service
                </p>
            </div>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id="leagueAdmin"
                       name="access.leagueAdmin" checked={account.access.leagueAdmin} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor="leagueAdmin">League Admin</label>
                <p>
                    Can manage teams, divisions and seasons
                </p>
            </div>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id="teamAdmin"
                       name="access.teamAdmin" checked={account.access.teamAdmin} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor="teamAdmin">Team Admin</label>
                <p>
                    Can manage teams
                </p>
            </div>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id="gameAdmin"
                       name="access.gameAdmin" checked={account.access.gameAdmin} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor="gameAdmin">Game Admin</label>
                <p>
                    Can record scores and view man of the match records and manage games
                </p>
            </div>
        </div>
        <div>
            <button className="btn btn-primary" onClick={saveChanges}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Set access
            </button>
        </div>
    </div>)
}