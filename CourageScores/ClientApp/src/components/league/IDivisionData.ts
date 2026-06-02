import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface IDivisionData extends DivisionDataDto {
    onReloadDivision(
        preventReloadIfIdsAreTheSame?: boolean,
    ): Promise<DivisionDataDto | null>;
    setDivisionData?(data?: DivisionDataDto): UntypedPromise;
    favouritesEnabled?: boolean;
}
