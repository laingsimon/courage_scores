import {DivisionDataDto} from "./models/dtos/Division/DivisionDataDto";

export interface IDivisionData extends DivisionDataDto {
    onReloadDivision: (preventReloadIfIdsAreTheSame?: boolean) => Promise<DivisionDataDto | null>;
    setDivisionData: (data: DivisionDataDto) => Promise<any>;
}