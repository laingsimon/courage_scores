import { UserDto } from '../interfaces/models/dtos/Identity/UserDto.ts';
import { AccessOption } from '../interfaces/models/dtos/Identity/AccessOption.ts';
import { all, any } from './collections.ts';
import { AccessLevelDto } from '../interfaces/models/dtos/Identity/AccessLevelDto';

export interface IAccessLevels {
    [key: string]: AccessLevelDto;
}

export function hasAccess(
    account: UserDto | undefined,
    option: AccessOption,
): boolean {
    return !!account?.accessLevels?.[option];
}

export function hasAllAccess(
    account: UserDto | undefined,
    ...options: AccessOption[]
): boolean {
    if (options.length === 0) {
        return false;
    }

    return all(options, (op) => hasAccess(account, op));
}

export function hasAnyAccess(
    account: UserDto | undefined,
    ...options: AccessOption[]
): boolean {
    if (options.length === 0) {
        return false;
    }

    return any(options, (op) => hasAccess(account, op));
}
