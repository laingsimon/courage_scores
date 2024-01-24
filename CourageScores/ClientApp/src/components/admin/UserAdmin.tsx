import React, {useEffect, useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {useAdmin} from "./AdminContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IUserDto} from "../../interfaces/serverSide/Identity/IUserDto";
import {IUpdateAccessDto} from "../../interfaces/serverSide/Identity/IUpdateAccessDto";
import {IAccessDto} from "../../interfaces/serverSide/Identity/IAccessDto";

export function UserAdmin() {
    const {account, onError, reloadAccount} = useApp();
    const {accountApi} = useDependencies();
    const {accounts} = useAdmin();
    const [saving, setSaving] = useState<boolean>(false);
    const [userAccount, setUserAccount] = useState<IUserDto | null>(null);
    const [emailAddress, setEmailAddress] = useState<string>(account.emailAddress);
    const [loading, setLoading] = useState<boolean>(true);
    const [saveError, setSaveError] = useState<IClientActionResultDto<IUserDto> | null>(null);
    const [showEmailAddress, setShowEmailAddress] = useState<boolean>(false);

    useEffect(() => {
            try {
                if (!accounts) {
                    return;
                }

                if (emailAddress) {
                    showAccess(accounts, emailAddress);
                }
            } catch (exc) {
                /* istanbul ignore next */
                onError(exc);
            } finally {
                setLoading(false);
            }
        },
        // eslint-disable-next-line
        [accounts]);

    function valueChanged(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            const currentAccount: IUserDto = Object.assign({}, userAccount);
            const value: string | boolean = event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value;

            let name: string = event.target.name;
            let dataObject: { [key: string]: any } = currentAccount;
            while (name.indexOf('.') !== -1) {
                const prefix: string = name.substring(0, name.indexOf('.'));
                name = name.substring(prefix.length + 1);
                if (!dataObject[prefix]) {
                    dataObject[prefix] = {};
                }
                dataObject = dataObject[prefix];
            }

            dataObject[name] = value;
            setUserAccount(currentAccount);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    async function saveChanges() {
        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        setSaving(true);
        try {
            const update: IUpdateAccessDto = {
                emailAddress: emailAddress,
                access: userAccount.access,
            };
            const result: IClientActionResultDto<IUserDto> = await accountApi.update(update);
            if (!result.success) {
                setSaveError(result);
            } else if (account.emailAddress === update.emailAddress) {
                await reloadAccount();
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    async function changeAccount(emailAddress: string) {
        setEmailAddress(emailAddress);

        showAccess(accounts, emailAddress);
    }

    function showAccess(accounts: IUserDto[], emailAddress: string) {
        const userAccount: IUserDto = accounts.filter(a => a.emailAddress === emailAddress)[0];
        setUserAccount(userAccount);
    }

    function renderAccessOption(name: string, description: string) {
        const access: IAccessDto = (userAccount ? userAccount : {}).access || {};

        return (<div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id={name}
                       name={`access.${name}`} checked={access[name] || false} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor={name}>{description}</label>
            </div>
        </div>);
    }

    function toOption(acc: IUserDto): IBootstrapDropdownItem {
        const name: string = acc.emailAddress === account.emailAddress
            ? `You`
            : acc.name;
        const className: string = acc.emailAddress === account.emailAddress
            ? 'fw-bold'
            : undefined;

        return {
            value: acc.emailAddress,
            text: `${name}${showEmailAddress ? ' ' + acc.emailAddress : ''}`,
            className: className
        };
    }

    return (<div className="content-background p-3">
        <h3>Manage access</h3>
        <div className="input-group mb-3 d-flex">
            <div className="input-group-prepend">
                <span className="input-group-text">Account</span>
            </div>
            {loading
                ? (<div>
                    <LoadingSpinnerSmall/>
                </div>)
                : <BootstrapDropdown
                    options={accounts ? accounts.map(toOption) : []}
                    onChange={changeAccount}
                    value={emailAddress} className="margin-right"/>}
            <div className="form-check form-switch margin-left mt-1">
                <input className="form-check-input" type="checkbox" id="showEmailAddress" checked={showEmailAddress}
                       onChange={event => setShowEmailAddress(event.target.checked)}/>
                <label className="form-check-label" htmlFor="showEmailAddress">Show email address</label>
            </div>
        </div>
        <h6>Access</h6>
        {renderAccessOption('manageAccess', 'Manage user access')}
        {renderAccessOption('manageDivisions', 'Manage divisions')}
        {renderAccessOption('manageGames', 'Manage games')}
        {renderAccessOption('manageTournaments', 'Manage tournaments')}
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
        {renderAccessOption('runHealthChecks', 'Run health checks')}
        {renderAccessOption('manageSeasonTemplates', 'Manage season templates')}
        {renderAccessOption('showDebugOptions', 'Show debug options')}
        {renderAccessOption('manageSockets', 'Manage web sockets')}
        {renderAccessOption('useWebSockets', 'Show live results')}
        <div>
            <button className="btn btn-primary" onClick={saveChanges} disabled={loading}>
                {saving
                    ? (<LoadingSpinnerSmall/>)
                    : null}
                Set access
            </button>
        </div>
        {saveError
            ? (<ErrorDisplay {...saveError} onClose={async () => setSaveError(null)} title="Could not save access"/>)
            : null}
    </div>);
}