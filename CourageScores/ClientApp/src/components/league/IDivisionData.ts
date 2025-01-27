import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IDivisionData extends DivisionDataDto {
    onReloadDivision(preventReloadIfIdsAreTheSame?: boolean): Promise<DivisionDataDto | null>;
    setDivisionData?(data?: DivisionDataDto): UntypedPromise;
    favouritesEnabled?: boolean;
}