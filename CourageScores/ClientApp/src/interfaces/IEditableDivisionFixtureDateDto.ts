import {DivisionFixtureDateDto} from "./models/dtos/Division/DivisionFixtureDateDto";

export interface IEditableDivisionFixtureDateDto extends DivisionFixtureDateDto {
    isKnockout?: boolean;
    isNew?: boolean;
}