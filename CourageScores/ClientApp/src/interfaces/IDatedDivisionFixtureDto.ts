import {DivisionFixtureDto} from "./models/dtos/Division/DivisionFixtureDto";

export interface IDatedDivisionFixtureDto extends DivisionFixtureDto {
    date: string;
}
