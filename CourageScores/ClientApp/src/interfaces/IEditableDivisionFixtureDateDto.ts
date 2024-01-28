import {IDivisionFixtureDateDto} from "./serverSide/Division/IDivisionFixtureDateDto";

export interface IEditableDivisionFixtureDateDto extends IDivisionFixtureDateDto {
    isKnockout?: boolean;
    isNew?: boolean;
}