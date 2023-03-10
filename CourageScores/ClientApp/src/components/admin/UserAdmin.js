import React, {useEffect, useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useAdmin} from "./AdminContainer";

export function UserAdmin() {
    const { account, onError } = useApp();
    const { accountApi } = useDependencies();
    const { accounts } = useAdmin();
    const [ saving, setSaving ] = useState(false);
    const [ userAccount, setUserAccount ] = useState(null);
    const [ emailAddress, setEmailAddress ] = useState(account.emailAddress);
    const [ loading, setLoading ] = useState(true);
    const [ saveError, setSaveError ] = useState(null);
    const [ showEmailAddress, setShowEmailAddress ] = useState(false);

    useEffect(() => {
        try {
            if (!accounts) {
                return;
            }

            if (emailAddress) {
                showAccess(accounts, emailAddress);
            }
        }
        catch (exc) {
            onError(exc);
        } finally {
            setLoading(false);
        }
    },
    // eslint-disable-next-line
    [ accounts ]);

    function valueChanged(event) {
        try {
            const currentAccount = Object.assign({}, userAccount);
            const value = event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value;

            let name = event.target.name;
            let dataObject = currentAccount;
            while (name.indexOf('.') !== -1) {
                const prefix = name.substring(0, name.indexOf('.'));
                name = name.substring(prefix.length + 1);
                if (!dataObject[prefix]) {
                    dataObject[prefix] = {};
                }
                dataObject = dataObject[prefix];
            }

            dataObject[name] = value;
            setUserAccount(currentAccount);
        } catch (e) {
            onError(e);
        }
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
            const result = await accountApi.update(update);
            if (!result.success) {
                setSaveError(result);
            }
        } catch (e) {
            setSaveError(e);
        }
        finally {
            setSaving(false);
        }
    }

    function changeAccount(emailAddress) {
        setEmailAddress(emailAddress);

        showAccess(accounts, emailAddress);
    }

    function showAccess(accounts, emailAddress) {
        const userAccount = accounts.filter(a => a.emailAddress === emailAddress)[0];
        setUserAccount(userAccount);
    }

    function renderAccessOption(name, description) {
        const access = (userAccount ? userAccount : {}).access || {};

        return (<div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id={name}
                       name={`access.${name}`} checked={access[name] || false} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor={name}>{description}</label>
            </div>
        </div>);
    }

    function toOption(acc) {
        const name = acc.emailAddress === account.emailAddress
            ? `You`
            : acc.name;
        const className = acc.emailAddress === account.emailAddress
            ? 'fw-bold'
            : undefined;

        return { value: acc.emailAddress, text: `${name}${showEmailAddress ? ' ' + acc.emailAddress : ''}`, className: className };
    }

    return (<div className="light-background p-3">
        <h3>Manage access</h3>
        <div className="input-group mb-3 d-flex">
            <div className="input-group-prepend">
                <span className="input-group-text">Account</span>
            </div>
            {loading
                ? (<div><span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span></div>)
                : <BootstrapDropdown
                    options={accounts ? accounts.map(toOption) : []}
                    onChange={changeAccount}
                    value={emailAddress} className="margin-right" />}
            <div className="form-check form-switch margin-left mt-1">
                <input className="form-check-input" type="checkbox" id="showEmailAddress" checked={showEmailAddress} onChange={event => setShowEmailAddress(event.target.checked)}/>
                <label className="form-check-label" htmlFor="showEmailAddress">Show email address</label>
            </div>
        </div>
        <h6>Access</h6>
        {renderAccessOption('manageAccess', 'Manage user access')}
        {renderAccessOption('manageDivisions', 'Manage divisions')}
        {renderAccessOption('manageGames', 'Manage games')}
        {renderAccessOption('manageNotes', 'Manage fixture/date notes')}
        {renderAccessOption('managePlayers', 'Manage players')}
        {renderAccessOption('manageScores', 'Manage scores')}
        {renderAccessOption('manageSeasons', 'Manage seasons')}
        {renderAccessOption('manageTeams', 'Manage teams')}
        {renderAccessOption('runReports', 'Run reports')}
        {renderAccessOption('exportData', 'Export data (backup)')}
        {renderAccessOption('importData', 'Import data (restore)')}
        {renderAccessOption('inputResults', 'Input results')}
        {renderAccessOption('viewExceptions', 'View exceptions')}
        {renderAccessOption('recordScoresAsYouGo', 'Record scores as you go')}
        <div>
            <button className="btn btn-primary" onClick={saveChanges} disabled={loading}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Set access
            </button>
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save access" />) : null}
    </div>);
}
