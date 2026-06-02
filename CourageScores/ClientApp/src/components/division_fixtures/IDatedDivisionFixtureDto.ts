import { DivisionFixtureDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDto.ts';

export interface IDatedDivisionFixtureDto extends DivisionFixtureDto {
    date: string;
}
