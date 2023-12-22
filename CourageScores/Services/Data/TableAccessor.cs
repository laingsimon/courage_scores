using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class TableAccessor : ITableAccessor
{
    private readonly TableDto _table;

    public TableAccessor(TableDto table)
    {
        _table = table;
    }

    public string TableName => _table.Name;

    public async Task ExportData(Database database, ExportDataResultDto result, IZipBuilder builder,
        ExportDataRequestDto request, CancellationToken token)
    {
        result.Tables.Add(TableName, 0);
        request.CaseInsensitiveTables.TryGetValue(TableName, out var ids);
        var idsToReturn = ids?.Select(id => id.ToString()).ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>();

        Container container = await database.CreateContainerIfNotExistsAsync(_table.EnvironmentalName, _table.PartitionKey, cancellationToken: token);

        var records = container.GetItemQueryIterator<JObject>();

        while (records.HasMoreResults && !token.IsCancellationRequested)
        {
            var record = await records.ReadNextAsync(token);

            foreach (var row in record)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }

                var id = row.Value<string>(_table.PartitionKey.TrimStart('/'))!;

                if (!idsToReturn.Any() || idsToReturn.Contains(id))
                {
                    await ExportRow(row, id, result, builder, request);
                }
            }
        }
    }

    private async Task ExportRow(JObject row, string id, ExportDataResultDto result, IZipBuilder builder, ExportDataRequestDto request)
    {
        var deleted = row.Value<DateTime?>("Deleted");
        if (deleted.HasValue && !request.IncludeDeletedEntries)
        {
            return; // don't process deleted rows
        }

        result.Tables[TableName]++;
        await builder.AddFile(TableName, id, row);
    }
}