using System.Diagnostics.CodeAnalysis;
using CourageScores.Filters;
using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Services.Data;

[ExcludeFromCodeCoverage]
public class DataImporterFactory : IDataImporterFactory
{
    private readonly Database _database;
    private readonly ScopedCacheManagementFlags _flags;

    public DataImporterFactory(Database database, ScopedCacheManagementFlags flags)
    {
        _database = database;
        _flags = flags;
    }

    public async Task<IDataImporter> Create(ImportDataRequestDto request, ImportDataResultDto result, IAsyncEnumerable<TableDto> tables)
    {
        return new DataImporter(_database, request, result, await tables.ToList(), _flags);
    }
}