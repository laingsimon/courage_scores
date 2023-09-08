using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Services.Data;

public interface ITableAccessor
{
    string TableName { get; }

    Task ExportData(Database database, ExportDataResultDto result, IZipBuilder builder,
        ExportDataRequestDto request, CancellationToken token);
}