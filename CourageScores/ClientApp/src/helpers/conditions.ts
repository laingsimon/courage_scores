import { UserDto } from '../interfaces/models/dtos/Identity/UserDto.ts';
import { AccessOption } from '../interfaces/models/dtos/Identity/AccessOption.ts';
import { all, any } from './collections.ts';
import { AccessLevelDto } from '../interfaces/models/dtos/Identity/AccessLevelDto';

export interface IAccessLevels {
    [key: string]: AccessLevelDto;
}

export interface UserAccessContext {
    option: AccessOption;
    seasonId?: string;
    divisionId?: string;
    teamId?: string;
}

const permitted = (accessLevelIds?: string[], contextId?: string): boolean => {
    if (accessLevelIds?.length === 0) {
        return false;
    }

    if (!accessLevelIds || !contextId) {
        return true;
    }

    return accessLevelIds.includes(contextId);
};

export function hasAccessLevel(
    account: UserDto | undefined,
    context: UserAccessContext,
): boolean {
    const accessLevel = account?.accessLevels?.[context.option];
    if (!accessLevel) {
        return false;
    }

    const seasonPermitted = permitted(accessLevel.seasonIds, context.seasonId);
    const divisionPermitted = permitted(
        accessLevel.divisionIds,
        context.divisionId,
    );
    const teamPermitted = permitted(accessLevel.teamIds, context.teamId);

    return seasonPermitted && divisionPermitted && teamPermitted;
}

export function hasAllAccessLevels(
    account: UserDto | undefined,
    ...contexts: UserAccessContext[]
): boolean {
    if (contexts.length === 0) {
        return false;
    }

    return all(contexts, (context) => hasAccessLevel(account, context));
}

export function hasAnyAccessLevel(
    account: UserDto | undefined,
    ...contexts: UserAccessContext[]
): boolean {
    if (contexts.length === 0) {
        return false;
    }

    return any(contexts, (context) => hasAccessLevel(account, context));
}

export function hasAccess(
    account: UserDto | undefined,
    option: AccessOption,
): boolean {
    return hasAccessLevel(account, { option });
}
