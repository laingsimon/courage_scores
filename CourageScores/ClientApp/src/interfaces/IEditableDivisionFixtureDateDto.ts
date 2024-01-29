import {IDivisionFixtureDateDto} from "./dtos/Division/IDivisionFixtureDateDto";

export interface IEditableDivisionFixtureDateDto extends IDivisionFixtureDateDto {
    isKnockout?: boolean;
    isNew?: boolean;
}