import {IHttp} from "./http";
import {IUserDto} from "../interfaces/dtos/Identity/IUserDto";
import {IUpdateAccessDto} from "../interfaces/dtos/Identity/IUpdateAccessDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";

export interface IAccountApi {
    get(emailAddress: string): Promise<IUserDto | null>;
    getAll(): Promise<IUserDto[]>;
    account(): Promise<IUserDto | null>;
    update(account: IUpdateAccessDto): Promise<IClientActionResultDto<IUserDto>>;
}

class AccountApi implements IAccountApi {
    private http: IHttp;
    constructor(http: IHttp) {
        this.http = http;
    }

    get(emailAddress: string): Promise<IUserDto | null> {
        return this.http.get(`/api/Account/${emailAddress}`);
    }

    getAll(): Promise<IUserDto[]> {
        return this.http.get(`/api/Account/All`);
    }

    account(): Promise<IUserDto | null> {
        return this.http.get(`/api/Account`);
    }

    update(account: IUpdateAccessDto): Promise<IClientActionResultDto<IUserDto>> {
        return this.http.post(`/api/Account/Access`, account);
    }
}

export {AccountApi};