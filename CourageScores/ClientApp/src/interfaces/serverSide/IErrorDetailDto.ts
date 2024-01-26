// see CourageScores.Models.Dtos.ErrorDetailDto
export interface IErrorDetailDto {
    source: string;
    time?: string;
    message: string;
    stack?: string[];
    type?: string;
    userName?: string;
    userAgent?: string;
    url?: string;
    lastUpdated?: string;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id: string;
}
