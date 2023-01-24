using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Services.Data;

public interface ITableAccessor
{
    Task ExportData(Database database, ExportDataResultDto result, ZipBuilder builder,
        ExportDataRequestDto request, CancellationToken token);
}