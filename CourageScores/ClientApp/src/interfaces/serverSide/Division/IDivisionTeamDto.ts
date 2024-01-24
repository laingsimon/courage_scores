// see CourageScores.Models.Dtos.Division.DivisionTeamDto
export interface IDivisionTeamDto {
    id?: string;
    name: string;
    played?: number;
    points?: number;
    fixturesWon?: number;
    fixturesLost?: number;
    fixturesDrawn?: number;
    difference?: number;
    address: string;
    matchesWon?: number;
    matchesLost?: number;
    winRate?: number;
    lossRate?: number;
    updated?: string;
    rank?: number;
}
