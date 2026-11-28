import { TableDto } from '../../interfaces/models/dtos/Data/TableDto.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface IAdmin {
    tables: TableDto[] | null;
    accounts: UserDto[] | null;
    reloadAccounts: () => UntypedPromise;
}
