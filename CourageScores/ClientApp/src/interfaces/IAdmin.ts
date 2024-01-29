import {ITableDto} from "./dtos/Data/ITableDto";
import {IUserDto} from "./dtos/Identity/IUserDto";

export interface IAdmin {
    tables: ITableDto[] | null;
    accounts: IUserDto[] | null;
}