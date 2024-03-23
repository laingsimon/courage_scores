import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";

export interface IEditableDivisionFixtureDateDto extends DivisionFixtureDateDto {
    isKnockout?: boolean;
    isNew?: boolean;
}