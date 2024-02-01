import {TableDto} from "./models/dtos/Data/TableDto";
import {UserDto} from "./models/dtos/Identity/UserDto";

export interface IAdmin {
    tables: TableDto[] | null;
    accounts: UserDto[] | null;
}