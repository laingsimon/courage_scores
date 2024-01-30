import {ITableDto} from "./models/dtos/Data/ITableDto";
import {IUserDto} from "./models/dtos/Identity/IUserDto";

export interface IAdmin {
    tables: ITableDto[] | null;
    accounts: IUserDto[] | null;
}