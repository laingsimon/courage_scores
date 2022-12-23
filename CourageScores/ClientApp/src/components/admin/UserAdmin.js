import React, {useState } from 'react';
import {Settings} from "../../api/settings";
import {Http} from "../../api/http";
import {AccountApi} from "../../api/account";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {NotPermitted} from "./NotPermitted";

export function UserAdmin({account}) {
    const api = new AccountApi(new Http(new Settings()));
    const [ saving, setSaving ] = useState(false);
    const [ userAccount, setUserAccount ] = useState({
        access: { }
    });
    const [ emailAddress, setEmailAddress ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const isAdmin = account && account.access && account.access.manageAccess;

    async function loadAccess() {
        if (loading) {
            return;
        }

        try {
            if (emailAddress) {
                setLoading(true);
                const api = new AccountApi(new Http(new Settings()));
                const accessDetail = await api.get(emailAddress);
                if (accessDetail) {
                    setUserAccount(Object.assign({}, userAccount, {
                        access: accessDetail.access
                    }));
                } else {
                    setUserAccount(Object.assign({}, userAccount, {
                        access: {},
                    }));
                }
            }
        } catch (e) {
            setSaveError(e.toString());
        } finally {
            setLoading(false);
        }
    }

    function valueChanged(event) {
        const currentAccount = Object.assign({}, userAccount);
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
        setUserAccount(currentAccount);
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
                access: userAccount.access,
            };
            const result = await api.update(update);
            if (result.success) {
                window.alert('Access updated');
            } else {
                setSaveError(result);
            }
        } catch (e) {
            setSaveError(e.toString());
        }
        finally {
            setSaving(false);
        }
    }

    function renderAccessOption(name, description) {
        return (<div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id={name}
                       name={`access.${name}`} checked={userAccount.access[name] || false} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor={name}>{description}</label>
            </div>
        </div>);
    }

    if (!isAdmin) {
        return (<NotPermitted />);
    }

    return (<div className="light-background p-3">
        <h3>Set access for a user</h3>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Email address</span>
            </div>
            <input disabled={saving || !isAdmin} type="text" className="form-control"
                   name="emailAddress" value={emailAddress} onBlur={loadAccess} onChange={(event) => setEmailAddress(event.target.value)}/>
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
        {renderAccessOption('runReports', 'Run reports')}
        {renderAccessOption('exportData', 'Export data (backup)')}
        {renderAccessOption('importData', 'Import data (restore)')}
        {renderAccessOption('inputResults', 'Input results')}
        <div>
            <button className="btn btn-primary" onClick={saveChanges} disabled={loading || !isAdmin}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Set access
            </button>
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save access" />) : null}
    </div>);
}