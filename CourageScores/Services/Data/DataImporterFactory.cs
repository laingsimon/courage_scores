using System.Diagnostics.CodeAnalysis;
using CourageScores.Common;
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
        var tableList = await tables.ToList();
        if (tableList.Count == 0)
        {
            throw new ArgumentException("List of tables is empty", nameof(tables));
        }

        return new DataImporter(_database, request, result, tableList, _flags);
    }
}
