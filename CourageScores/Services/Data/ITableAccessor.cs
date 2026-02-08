using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public interface ITableAccessor
{
    string TableName { get; }

    Task ExportData(Database database, ExportDataResultDto result, IZipBuilder builder,
        ExportDataRequestDto request, CancellationToken token);
}
