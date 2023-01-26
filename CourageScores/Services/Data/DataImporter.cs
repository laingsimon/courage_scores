using System.Net;
using System.Runtime.CompilerServices;
using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class DataImporter : IDataImporter
{
    private readonly Database _database;
    private readonly ImportDataRequestDto _request;
    private readonly ImportDataResultDto _result;
    private readonly IReadOnlyCollection<TableDto> _currentTables;

    public DataImporter(Database database, ImportDataRequestDto request, ImportDataResultDto result, IReadOnlyCollection<TableDto> currentTables)
    {
        _database = database;
        _request = request;
        _result = result;
        _currentTables = currentTables;
    }

    public async IAsyncEnumerable<string> ImportData(IReadOnlyCollection<string> tables, IZipFileReader zip, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var table in _currentTables)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            if (tables.Any() && !tables.Contains(table.Name, StringComparer.OrdinalIgnoreCase))
            {
                // this table isn't in the list of permitted tables
                continue;
            }

            var tableName = _request.DryRun
                ? table.Name + "_import"
                : table.Name;

            var recordsToImport = zip.EnumerateFiles(table.Name).ToArray();
            yield return $"{(_request.DryRun ? "DRY RUN: " : "")}Importing data into {tableName} ({recordsToImport.Length} record/s)";

            Container container = await _database.CreateContainerIfNotExistsAsync(tableName, table.PartitionKey, cancellationToken: token);
            foreach (var recordToImport in recordsToImport)
            {
                if (_result.Tables.TryGetValue(table.Name, out var recordCount))
                {
                    _result.Tables[table.Name] = recordCount + 1;
                }
                else
                {
                    _result.Tables.Add(table.Name, 1);
                }

                Exception? error = null;
                try
                {
                    await ImportRecord(await zip.ReadJson<JObject>(recordToImport), container, token);
                }
                catch (Exception exc)
                {
                    error = exc;
                }

                if (error != null)
                {
                    yield return $"ERROR: {error.Message}";
                }
            }

            if (_request.DryRun && tableName.EndsWith("_import"))
            {
                await container.DeleteContainerAsync(cancellationToken: token);
                yield return $"DRY RUN: Deleting temporary table: {tableName}";
            }
        }
    }

    public async IAsyncEnumerable<string> PurgeData(IReadOnlyCollection<string> tables, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var table in _currentTables)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            if (tables.Any() && tables.Contains(table.Name, StringComparer.OrdinalIgnoreCase))
            {
                // this table isn't in the list of permitted tables
                continue;
            }

            yield return $"{(_request.DryRun ? "DRY RUN: " : "")}Purging data in {table.Name}";
            if (!_request.DryRun)
            {
                await PurgeData(table.Name, token);
            }
        }
    }

    private static async Task ImportRecord(JObject recordToImport, Container container, CancellationToken token)
    {
        var result = await container.UpsertItemAsync(recordToImport, cancellationToken: token);

        if (result.StatusCode == HttpStatusCode.Created || result.StatusCode == HttpStatusCode.OK)
        {
            // updated or created
            return;
        }

        throw new InvalidOperationException($"Could not import row: {result.StatusCode}");
    }

    private async Task PurgeData(string tableName, CancellationToken token)
    {
        var container = _database.GetContainer(tableName);
        await container.DeleteContainerAsync(cancellationToken: token);
    }
}