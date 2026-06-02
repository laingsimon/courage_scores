import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto.ts';

export interface IEditableDivisionFixtureDateDto extends DivisionFixtureDateDto {
    isKnockout?: boolean;
    isNew?: boolean;
}
