import {IDivisionFixtureDto} from "./serverSide/Division/IDivisionFixtureDto";

export interface IDatedDivisionFixtureDto extends IDivisionFixtureDto {
    date: string;
}
