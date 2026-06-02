import { TableDto } from '../../interfaces/models/dtos/Data/TableDto.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';

export interface IAdmin {
    tables: TableDto[] | null;
    accounts: UserDto[] | null;
}
