using CourageScores.Models.Dtos.Data;

namespace CourageScores.Services.Data;

public interface IDataImporterFactory
{
    Task<IDataImporter> Create(ImportDataRequestDto request, ImportDataResultDto result, IAsyncEnumerable<TableDto> tables);
}