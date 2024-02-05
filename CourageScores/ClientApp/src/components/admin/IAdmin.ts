import {TableDto} from "../../interfaces/models/dtos/Data/TableDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";

export interface IAdmin {
    tables: TableDto[] | null;
    accounts: UserDto[] | null;
}