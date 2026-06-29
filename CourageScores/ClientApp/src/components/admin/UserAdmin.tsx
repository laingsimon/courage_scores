// noinspection SqlDialectInspection,SqlNoDataSourceInspection

import React, { useEffect, useState } from 'react';
import { ErrorDisplay } from '../common/ErrorDisplay.tsx';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../common/BootstrapDropdown.tsx';
import { useDependencies } from '../common/IocContainer.tsx';
import { useApp } from '../common/AppContainer.tsx';
import { useAdmin } from './AdminContainer.tsx';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';
import { UpdateAccessDto } from '../../interfaces/models/dtos/Identity/UpdateAccessDto.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';
import { IAccessLevels } from '../../helpers/conditions.ts';
import { groupBy } from '../../helpers/collections.ts';

interface IAccessMapping {
    option: AccessOption;
    section: string;
    name: string;
    description?: string;
}

const accessMappings: IAccessMapping[] = [
    {
        option: AccessOption.analyseMatches,
        section: 'Superleague',
        name: 'Analyse scores',
        description: 'Analyse scores across fixtures',
    },
    {
        option: AccessOption.bulkDeleteLeagueFixtures,
        section: 'League',
        name: 'Bulk delete fixtures',
        description: 'Delete all unplayed fixtures in a season in one go',
    },
    {
        option: AccessOption.deleteAnyPhoto,
        section: 'League',
        name: 'Delete photos from anyone',
    },
    {
        option: AccessOption.exportData,
        section: 'System admin',
        name: 'Export data (backup)',
    },
    {
        option: AccessOption.enterTournamentResults,
        section: 'Superleague',
        name: 'Enter tournament results',
        description: 'Record scores for tournaments without editing details',
    },
    {
        option: AccessOption.inputResults,
        section: 'League',
        name: 'Input results',
        description: 'Enter league-fixture results for their team',
    },
    {
        option: AccessOption.importData,
        section: 'System admin',
        name: 'Import data (restore)',
    },
    {
        option: AccessOption.kioskMode,
        section: 'Superleague',
        name: 'Score results in full screen',
        description: 'Enter full screen when recording scores',
    },
    {
        option: AccessOption.loginServiceAccounts,
        section: 'Superleague',
        name: 'Login service accounts',
        description: 'Login tables and tv accounts remotely',
    },
    {
        option: AccessOption.manageAccess,
        section: 'System admin',
        name: 'Manage user access',
        description: 'Manage who can do what',
    },
    {
        option: AccessOption.manageScores,
        section: 'League',
        name: 'Manage scores',
        description: '⚠️ Enter league-fixture results for any team',
    },
    {
        option: AccessOption.managePlayers,
        section: 'League',
        name: 'Manage players',
        description: 'Add/Edit/Delete players',
    },
    {
        option: AccessOption.manageTournaments,
        section: 'League',
        name: 'Manage tournaments',
        description: 'Create/Edit/Delete tournaments and record scores',
    },
    {
        option: AccessOption.manageGames,
        section: 'League',
        name: 'Manage games',
        description: 'Create/Edit/Delete league fixtures',
    },
    {
        option: AccessOption.manageDivisions,
        section: 'League',
        name: 'Manage divisions',
    },
    {
        option: AccessOption.manageFeatures,
        section: 'System admin',
        name: 'Manage features',
        description: 'Configure system features',
    },
    {
        option: AccessOption.manageSockets,
        section: 'System admin',
        name: 'Manage sockets',
        description: 'Manage who is viewing live results',
    },
    {
        option: AccessOption.manageSeasonTemplates,
        section: 'League',
        name: 'Manage season templates',
        description: 'Manage the templates used to create new seasons',
    },
    {
        option: AccessOption.manageNotes,
        section: 'League',
        name: 'Manage notes',
    },
    {
        option: AccessOption.manageSeasons,
        section: 'League',
        name: 'Manage seasons',
    },
    {
        option: AccessOption.manageTeams,
        section: 'League',
        name: 'Manage teams',
    },
    {
        option: AccessOption.runDataQueries,
        section: 'System admin',
        name: 'Run data queries',
        description: '⚠️ Query the data model',
    },
    {
        option: AccessOption.showDebugOptions,
        section: 'System admin',
        name: 'Show debug options',
        description: 'See additional debugging options',
    },
    {
        option: AccessOption.useWebSockets,
        section: 'Superleague',
        name: 'Show live results',
        description:
            "Show results as they're recorded on other devices (tv/mobile)",
    },
    {
        option: AccessOption.uploadPhotos,
        section: 'League',
        name: 'Upload photos',
    },
    {
        option: AccessOption.viewAnyPhoto,
        section: 'League',
        name: 'View photos from anyone',
        description: '⚠️ (allows viewing of man-of-the-match submissions)',
    },
    {
        option: AccessOption.viewExceptions,
        section: 'System admin',
        name: 'View exceptions',
        description: 'View any errors reported in the system',
    },
];

export function UserAdmin() {
    const { account, onError, reloadAccount } = useApp();
    const { accountApi } = useDependencies();
    const { accounts } = useAdmin();
    const [saving, setSaving] = useState<boolean>(false);
    const [userAccount, setUserAccount] = useState<UserDto | null>(null);
    const [emailAddress, setEmailAddress] = useState<string>(
        account?.emailAddress || '',
    );
    const [loading, setLoading] = useState<boolean>(true);
    const [saveError, setSaveError] =
        useState<IClientActionResultDto<UserDto> | null>(null);
    const [showEmailAddress, setShowEmailAddress] = useState<boolean>(false);

    useEffect(
        () => {
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
        [accounts],
    );

    function accessChanged(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            const currentAccount: UserDto = Object.assign({}, userAccount);
            const currentAccess: AccessDto = currentAccount.access ?? {};
            const value: string | boolean =
                event.target.type === 'checkbox'
                    ? event.target.checked
                    : event.target.value;
            const name: string = event.target.name;

            currentAccess[name] = value;
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
            const result: IClientActionResultDto<UserDto> =
                await accountApi.update(update);
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
        const userAccount: UserDto | undefined = accounts?.filter(
            (a) => a.emailAddress === emailAddress,
        )[0];
        setUserAccount(userAccount || null);
    }

    function renderAccessOption(
        name: string,
        description: string,
        explanation?: string,
    ) {
        const access: AccessDto = (userAccount ? userAccount : {}).access || {};

        return (
            <div key={name} className="input-group mb-3">
                <div className="form-check form-switch margin-right">
                    <input
                        disabled={saving}
                        className="form-check-input"
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={!!access[name]}
                        onChange={accessChanged}
                    />
                    <label className="form-check-label" htmlFor={name}>
                        {description}
                        {explanation ? (
                            <>
                                <br />
                                <small>{explanation}</small>
                            </>
                        ) : null}
                    </label>
                </div>
            </div>
        );
    }

    function toOption(acc: UserDto): IBootstrapDropdownItem {
        const name: string =
            acc.emailAddress === account?.emailAddress ? `You` : acc.name;
        const className: string | undefined =
            acc.emailAddress === account?.emailAddress ? 'fw-bold' : undefined;

        return {
            value: acc.emailAddress,
            text: `${acc.transient ? '🪅 ' : ''}${name}${showEmailAddress ? ' ' + acc.emailAddress : ''}`,
            className: className,
        };
    }

    return (
        <div className="content-background p-3">
            <h3>Manage access</h3>
            <div className="input-group mb-3 d-flex">
                <div className="input-group-prepend">
                    <span className="input-group-text">Account</span>
                </div>
                {loading ? (
                    <div>
                        <LoadingSpinnerSmall />
                    </div>
                ) : (
                    <BootstrapDropdown
                        options={accounts ? accounts.map(toOption) : []}
                        onChange={changeAccount}
                        value={emailAddress}
                        className="margin-right"
                    />
                )}
                <div className="form-check form-switch margin-left mt-1">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        name="showEmailAddress"
                        id="showEmailAddress"
                        checked={showEmailAddress}
                        onChange={(event) =>
                            setShowEmailAddress(event.target.checked)
                        }
                    />
                    <label
                        className="form-check-label"
                        htmlFor="showEmailAddress">
                        Show email address
                    </label>
                </div>
            </div>
            <ul>
                <li>⚠️ Man of the match data can be seen for any team</li>
            </ul>
            <h6>Access</h6>
            <div className="d-flex flex-wrap">
                {groupBy(accessMappings, 'section')
                    .sort((a, b) => a.key.localeCompare(b.key))
                    .map((grouping) => (
                        <div
                            key={grouping.key}
                            className="border-1 border-secondary border-solid m-1 p-2">
                            <h6>{grouping.key}</h6>
                            {grouping.items
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((ao) =>
                                    renderAccessOption(
                                        ao.option,
                                        ao.name,
                                        ao.description,
                                    ),
                                )}
                        </div>
                    ))}
            </div>
            <div>
                <button
                    className="btn btn-primary"
                    onClick={saveChanges}
                    disabled={loading}>
                    {saving ? <LoadingSpinnerSmall /> : null}
                    Set access
                </button>
            </div>
            {saveError ? (
                <ErrorDisplay
                    {...saveError}
                    onClose={async () => setSaveError(null)}
                    title="Could not save access"
                />
            ) : null}
        </div>
    );
}
