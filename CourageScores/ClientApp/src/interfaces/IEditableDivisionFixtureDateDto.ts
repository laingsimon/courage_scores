import {IDivisionFixtureDateDto} from "./models/dtos/Division/IDivisionFixtureDateDto";

export interface IEditableDivisionFixtureDateDto extends IDivisionFixtureDateDto {
    isKnockout?: boolean;
    isNew?: boolean;
}