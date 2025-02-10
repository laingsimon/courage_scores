import {UserDto} from "../interfaces/models/dtos/Identity/UserDto";
import {AccessDto} from "../interfaces/models/dtos/Identity/AccessDto";

export function hasAccess(account: UserDto | undefined, getAccess: (access: AccessDto) => boolean | undefined): boolean {
    // account && account.access && account.access.manageTournaments
    if (!account || !account.access) {
        return false;
    }

    return getAccess(account.access) || false;
}