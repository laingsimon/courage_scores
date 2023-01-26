using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Services.Data;

[ExcludeFromCodeCoverage]
public class DataImporterFactory : IDataImporterFactory
{
    private readonly Database _database;

    public DataImporterFactory(Database database)
    {
        _database = database;
    }

    public async Task<IDataImporter> Create(ImportDataRequestDto request, ImportDataResultDto result, IAsyncEnumerable<TableDto> tables)
    {
        return new DataImporter(_database, request, result, await tables.ToList());
    }
}