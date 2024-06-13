export interface IDivisionUri {
    requestedMode?: string;
    requestedDivisions?: IIdish[];
    requestedSeason?: IIdish;
}

export interface IIdish {
    id: string;
    name?: string;
    toString(): string;
}