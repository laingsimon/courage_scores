using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class TableAccessor : ITableAccessor
{
    private readonly string _partitionKey;

    public TableAccessor(string tableName, string partitionKey = "/id")
    {
        TableName = tableName;
        _partitionKey = partitionKey;
    }

    public string TableName { get; }

    public async Task ExportData(Database database, ExportDataResultDto result, ZipBuilder builder,
        ExportDataRequestDto request, CancellationToken token)
    {
        result.Tables.Add(TableName, 0);

        Container container = await database.CreateContainerIfNotExistsAsync(TableName, _partitionKey, cancellationToken: token);

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

                await ExportRow(row, result, builder, request);
            }
        }
    }

    private async Task ExportRow(JObject record, ExportDataResultDto result, ZipBuilder builder, ExportDataRequestDto request)
    {
        var deleted = record.Value<DateTime?>("Deleted");
        if (deleted.HasValue && !request.IncludeDeletedEntries)
        {
            return; // don't process deleted rows
        }

        var id = record.Value<string>(_partitionKey.TrimStart('/'));
        result.Tables[TableName]++;
        await builder.AddFile(TableName, id, record);
    }
}