export interface IDivisionUri {
    requestedMode?: string;
    requestedDivision?: IIdish;
    requestedSeason?: IIdish;
}

export interface IIdish {
    id: string;
    name?: string;
    toString(): string;
}