// noinspection SqlDialectInspection,SqlNoDataSourceInspection

import React, {useEffect, useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {useAdmin} from "./AdminContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {UpdateAccessDto} from "../../interfaces/models/dtos/Identity/UpdateAccessDto";
import {AccessDto} from "../../interfaces/models/dtos/Identity/AccessDto";

export function UserAdmin() {
    const {account, onError, reloadAccount} = useApp();
    const {accountApi} = useDependencies();
    const {accounts} = useAdmin();
    const [saving, setSaving] = useState<boolean>(false);
    const [userAccount, setUserAccount] = useState<UserDto | null>(null);
    const [emailAddress, setEmailAddress] = useState<string>(account?.emailAddress || '');
    const [loading, setLoading] = useState<boolean>(true);
    const [saveError, setSaveError] = useState<IClientActionResultDto<UserDto> | null>(null);
    const [showEmailAddress, setShowEmailAddress] = useState<boolean>(false);

    useEffect(() => {
            try {
                if (!accounts) {
                    /* istanbul ignore next */
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
            const currentAccount: UserDto = Object.assign({}, userAccount);
            const value: string | boolean = event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value;

            let name: string = event.target.name;
            /* eslint-disable @typescript-eslint/no-explicit-any */
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
            const update: UpdateAccessDto = {
                emailAddress: emailAddress,
                access: userAccount?.access,
            };
            const result: IClientActionResultDto<UserDto> = await accountApi.update(update);
            if (!result.success) {
                setSaveError(result);
            } else if (account?.emailAddress === update.emailAddress) {
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

    function showAccess(accounts: UserDto[] | null, emailAddress: string) {
        const userAccount: UserDto | undefined = accounts?.filter(a => a.emailAddress === emailAddress)[0];
        setUserAccount(userAccount || null);
    }

    function renderAccessOption(name: string, description: string, explanation?: string) {
        const access: AccessDto = (userAccount ? userAccount : {}).access || {};

        return (<div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id={name}
                       name={`access.${name}`} checked={access[name] || false} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor={name}>
                    {description}
                    {explanation ? (<><br /><small>{explanation}</small></>) : null}
                </label>
            </div>
        </div>);
    }

    function toOption(acc: UserDto): IBootstrapDropdownItem {
        const name: string = acc.emailAddress === account?.emailAddress
            ? `You`
            : acc.name;
        const className: string | undefined = acc.emailAddress === account?.emailAddress
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
        <ul>
            <li>⚠ Man of the match data can be seen for any team</li>
        </ul>
        <h6>Access</h6>
        <div className="d-flex flex-wrap">
            <div className="border-1 border-secondary border-solid m-1 p-2">
                <h6>League</h6>
                {renderAccessOption('managePlayers', 'Manage players', 'Add/Edit/Delete players')}
                {renderAccessOption('manageScores', 'Manage scores', '⚠ Enter league-fixture results for any team')}
                {renderAccessOption('inputResults', 'Input results', 'Enter league-fixture results for their team')}
            </div>
            <div className="border-1 border-secondary border-solid m-1 p-2">
                <h6>Tournaments <small>(pairs, singles, knockout and finals night)</small></h6>
                {renderAccessOption('manageTournaments', 'Manage tournaments', 'Create/Edit/Delete tournaments and record scores')}
                {renderAccessOption('enterTournamentResults', 'Enter tournament results', 'Record scores for tournaments without editing details')}
            </div>
            <div className="border-1 border-secondary border-solid m-1 p-2">
                <h6>Management</h6>
                {renderAccessOption('manageDivisions', 'Manage divisions', 'Create/Edit/Delete divisions')}
                {renderAccessOption('manageGames', 'Manage games', 'Create/Edit/Delete league fixtures')}
                {renderAccessOption('manageNotes', 'Manage fixture/date notes', 'Create/Edit/Delete notes in the fixture list')}
                {renderAccessOption('manageSeasons', 'Manage seasons', 'Create/Edit/Delete any seasons')}
                {renderAccessOption('manageTeams', 'Manage teams', 'Create/Edit/Delete any teams in a season')}
                {renderAccessOption('runHealthChecks', 'Run health checks', 'Run any health checks over a season')}
                {renderAccessOption('manageSeasonTemplates', 'Manage season templates', 'Manage the templates used to create new seasons')}
                {renderAccessOption('runReports', 'Run reports', 'Run league/season reports')}
            </div>
            <div className="border-1 border-secondary border-solid m-1 p-2">
                <h6>Live scoring (super league)</h6>
                {renderAccessOption('recordScoresAsYouGo', 'Record scores as they\'re played', 'Record scores as matches are played. Required for super league')}
                {renderAccessOption('useWebSockets', 'Show live results', 'Show results as they\'re recorded on other devices (tv/mobile)')}
                {renderAccessOption('kioskMode', 'Score results in full screen', 'Enter full screen when recording scores')}
            </div>
            <div className="border-1 border-secondary border-solid m-1 p-2">
                <h6>Photos</h6>
                {renderAccessOption('uploadPhotos', 'Upload photos of results', '(people can view and delete their own photos)')}
                {renderAccessOption('viewAnyPhoto', '⚠ View photos from anyone', '(allows viewing of man-of-the-match submissions)')}
                {renderAccessOption('deleteAnyPhoto', 'Delete photos from anyone')}
            </div>
            <div className="border-1 border-secondary border-solid m-1 p-2">
                <h6>System admin</h6>
                {renderAccessOption('manageAccess', 'Manage user access', 'Manage who can do what')}
                {renderAccessOption('showDebugOptions', 'Show debug options', 'See additional debugging options')}
                {renderAccessOption('manageSockets', 'Manage web sockets', 'Manage who is viewing live results')}
                {renderAccessOption('viewExceptions', 'View exceptions', 'View any errors reported in the system')}
                {renderAccessOption('exportData', 'Export data (backup)', 'Export/Backup data')}
                {renderAccessOption('importData', 'Import data (restore)', 'Import/Restore data')}
                {renderAccessOption('bulkDeleteLeagueFixtures', 'Bulk delete fixtures', 'Delete all unplayed fixtures in a season in one go')}
                {renderAccessOption('manageFeatures', 'Manage features', 'Configure system features')}
            </div>
        </div>
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