using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class TableAccessor
{
    private readonly string _tableName;
    private readonly string _partitionKey;

    public TableAccessor(string tableName, string partitionKey = "/id")
    {
        _tableName = tableName;
        _partitionKey = partitionKey;
    }

    public async Task ExportData(Database database, ExportDataResultDto result, ZipBuilder builder,
        ExportDataRequestDto request, CancellationToken token)
    {
        result.Tables.Add(_tableName, 0);

        Container container = await database.CreateContainerIfNotExistsAsync(_tableName, _partitionKey, cancellationToken: token);

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

                await ExportRow(row, result, builder, request, token);
            }
        }
    }

    private async Task ExportRow(JObject record, ExportDataResultDto result, ZipBuilder builder, ExportDataRequestDto request, CancellationToken token)
    {
        var deleted = record.Value<DateTime?>("Deleted");
        if (deleted.HasValue && !request.IncludeDeletedEntries)
        {
            return; // don't process deleted rows
        }

        var id = record.Value<string>(_partitionKey.TrimStart('/'));
        result.Tables[_tableName]++;
        await builder.AddFile(_tableName, id, record);
    }
}