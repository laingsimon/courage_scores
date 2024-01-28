import {ITableDto} from "./serverSide/Data/ITableDto";
import {IUserDto} from "./serverSide/Identity/IUserDto";

export interface IAdmin {
    tables: ITableDto[] | null;
    accounts: IUserDto[] | null;
}