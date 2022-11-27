import React, {useState, useEffect } from 'react';
import {Settings} from "../../api/settings";
import {Http} from "../../api/http";
import {AccountApi} from "../../api/account";
import {ErrorDisplay} from "../common/ErrorDisplay";

export function UserAdmin() {
    const api = new AccountApi(new Http(new Settings()));
    const [ saving, setSaving ] = useState(false);
    const [ account, setAccount ] = useState({
        access: { }
    });
    const [ emailAddress, setEmailAddress ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);

    useEffect(() => {
        if (loading) {
            return;
        }

        async function loadAccess() {
            if (emailAddress) {
                setLoading(true);
                const api = new AccountApi(new Http(new Settings()));
                const accessDetail = await api.get(emailAddress);
                if (accessDetail) {
                    setAccount(Object.assign({}, account, {
                        access: accessDetail.access
                    }));
                } else {
                    setAccount(Object.assign({}, account,{
                        access: { },
                    }));
                }
                setLoading(false);
            }
        }

        loadAccess();
    },
        // eslint-disable-next-line
[ emailAddress ]);

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

        if (!emailAddress) {
            window.alert('You must enter an email address');
            return;
        }

        setSaving(true);
        try {
            const update = {
                emailAddress: emailAddress,
                access: account.access,
            };
            const result = await api.update(update);
            if (result.success) {
                window.alert('Access updated');
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    function renderAccessOption(name, description) {
        return (<div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id={name}
                       name={`access.${name}`} checked={account.access[name] || false} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor={name}>{description}</label>
            </div>
        </div>);
    }

    return (<div className="light-background p-3">
        <h3>Set access for a user</h3>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Email address</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="emailAddress" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)}/>
        </div>
        <h6>
            {loading ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            Access
        </h6>
        {renderAccessOption('manageAccess', 'Manage user access')}
        {renderAccessOption('manageDivisions', 'Manage divisions')}
        {renderAccessOption('manageGames', 'Manage games')}
        {renderAccessOption('managePlayers', 'Manage players')}
        {renderAccessOption('manageScores', 'Manage scores')}
        {renderAccessOption('manageSeasons', 'Manage seasons')}
        {renderAccessOption('manageTeams', 'Manage teams')}
        <div>
            <button className="btn btn-primary" onClick={saveChanges} disabled={loading}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Set access
            </button>
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save access" />) : null}
    </div>);
}