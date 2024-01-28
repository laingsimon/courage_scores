// see CourageScores.Models.Dtos.Data.TableDto
export interface ITableDto {
    name: string;
    partitionKey: string;
    dataTypeName?: string;
    canImport?: boolean;
    canExport?: boolean;
    environmentalName: string;
}
