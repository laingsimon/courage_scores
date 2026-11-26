// noinspection SqlDialectInspection,SqlNoDataSourceInspection

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
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
import { all, groupBy } from '../../helpers/collections.ts';
import { AccessLevelDto } from '../../interfaces/models/dtos/Identity/AccessLevelDto';
import { UserAccessOption } from './UserAccessOption.tsx';
import { IRole, roleMappings } from './user_roles.ts';
import { accessMappings } from './user_access_mapping.ts';

export function UserAdmin() {
    const { account, onError, reloadAccount } = useApp();
    const { accountApi } = useDependencies();
    const { accounts } = useAdmin();
    const [saving, setSaving] = useState<boolean>(false);
    const [userAccount, setUserAccount] = useState<UserDto | undefined>(
        undefined,
    );
    const [loading, setLoading] = useState<boolean>(true);
    const [saveError, setSaveError] =
        useState<IClientActionResultDto<UserDto> | null>(null);
    const [showEmailAddress, setShowEmailAddress] = useState<boolean>(false);
    const location = useLocation();
    const navigate = useNavigate();
    const emailAddress = getEmailAddress(new URLSearchParams(location.search));

    function getEmailAddress(search: URLSearchParams): string | null {
        return search.has('select') ? search.get('select') : null;
    }

    function setEmailAddress(value: string) {
        navigate(`/admin/user/?select=${value}`);
    }

    useEffect(() => {
        if (!emailAddress) {
            setEmailAddress(account?.emailAddress!);
        } else {
            showAccess(accounts, emailAddress);
        }
    }, [emailAddress]);

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

    async function accessChanged(option: AccessOption, value?: AccessLevelDto) {
        try {
            const currentAccount: UserDto = Object.assign({}, userAccount);
            const accessLevels: IAccessLevels =
                currentAccount.accessLevels ?? {};

            if (value) {
                accessLevels[option] = value;
            } else {
                delete accessLevels[option];
            }
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
                emailAddress: emailAddress!,
                accessLevels: userAccount!.accessLevels,
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
    }

    function showAccess(accounts: UserDto[] | null, emailAddress: string) {
        const userAccount: UserDto | undefined = accounts?.filter(
            (a) => a.emailAddress === emailAddress,
        )[0];
        setUserAccount(userAccount);
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

    async function changeRole(value: string) {
        const role = roleMappings.find((r) => r.name === value);
        if (!role) {
            return;
        }

        const currentAccount: UserDto = Object.assign({}, userAccount);
        currentAccount.accessLevels = role!.accessLevels;
        setUserAccount(currentAccount);
    }

    function accessEqualsRole(role: IRole): boolean {
        function byName(a: string, b: string): number {
            return a.localeCompare(b);
        }

        function equatableRoles(accessLevels: IAccessLevels): string {
            return Object.keys(accessLevels).sort(byName).join(',');
        }

        function equatableLevel(level?: AccessLevelDto): string {
            if (!level) {
                return '';
            }

            return JSON.stringify({
                divisionIds: (level.divisionIds ?? []).sort(byName),
                seasonIds: (level.seasonIds ?? []).sort(byName),
                teamIds: (level.teamIds ?? []).sort(byName),
            });
        }

        if (
            equatableRoles(userAccount?.accessLevels ?? {}) !==
            equatableRoles(role.accessLevels)
        ) {
            return false;
        }

        return all(Object.keys(role.accessLevels), (option: string) => {
            const roleLevel = equatableLevel(role.accessLevels[option]);
            const userLevel = equatableLevel(userAccount?.accessLevels[option]);

            return !!userLevel && roleLevel === userLevel;
        });
    }

    function getCurrentRole() {
        return roleMappings.find(accessEqualsRole)?.name;
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
                        value={emailAddress ?? ''}
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
            <h6>
                Access | Role:
                <BootstrapDropdown
                    options={roleMappings
                        .map((r) => ({
                            value: r.name,
                            text: r.name,
                        }))
                        .sort((a, b) => a.text.localeCompare(b.text))}
                    onChange={changeRole}
                    value={getCurrentRole()}
                    className="margin-left"
                />
            </h6>
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
                                .map((ao) => (
                                    <UserAccessOption
                                        userAccount={userAccount}
                                        option={ao.option}
                                        accessChanged={accessChanged}
                                        key={ao.option}
                                        name={ao.name}
                                        description={ao.description}
                                    />
                                ))}
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
