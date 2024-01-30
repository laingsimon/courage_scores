import {IDivisionFixtureDto} from "./models/dtos/Division/IDivisionFixtureDto";

export interface IDatedDivisionFixtureDto extends IDivisionFixtureDto {
    date: string;
}
