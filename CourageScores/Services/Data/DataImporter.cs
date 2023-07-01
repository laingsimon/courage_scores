using System.Net;
using System.Runtime.CompilerServices;
using CourageScores.Filters;
using CourageScores.Models.Dtos.Data;
using Microsoft.Azure.Cosmos;
using Newtonsoft.Json.Linq;

namespace CourageScores.Services.Data;

public class DataImporter : IDataImporter
{
    private const string DryRunTableSuffix = "_import";

    private readonly Database _database;
    private readonly ImportDataRequestDto _request;
    private readonly ImportDataResultDto _result;
    private readonly IReadOnlyCollection<TableDto> _currentTables;
    private readonly ScopedCacheManagementFlags _flags;

    public DataImporter(
        Database database,
        ImportDataRequestDto request,
        ImportDataResultDto result,
        IReadOnlyCollection<TableDto> currentTables,
        ScopedCacheManagementFlags flags)
    {
        _database = database;
        _request = request;
        _result = result;
        _currentTables = currentTables;
        _flags = flags;
    }

    public async IAsyncEnumerable<string> ImportData(IReadOnlyCollection<string> tablesToImport, IZipFileReader zip, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var table in _currentTables)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            if (tablesToImport.Any() && !tablesToImport.Contains(table.Name, StringComparer.OrdinalIgnoreCase))
            {
                // this table isn't in the list of permitted tables
                continue;
            }

            var tableName = _request.DryRun
                ? table.EnvironmentalName + DryRunTableSuffix
                : table.EnvironmentalName;

            if (!_request.DryRun)
            {
                // evict the cache for all seasons and divisions
                _flags.EvictDivisionDataCacheForDivisionId = Guid.Empty;
                _flags.EvictDivisionDataCacheForSeasonId = Guid.Empty;
            }

            var files = zip.EnumerateFiles(table.Name).ToArray();
            yield return $"{(_request.DryRun ? "DRY RUN: " : "")}Importing data into {tableName} ({files.Length} record/s)";

            Container container = await _database.CreateContainerIfNotExistsAsync(tableName, table.PartitionKey, cancellationToken: token);
            await foreach (var message in ImportRecordsForTable(container, table, files, zip, token))
            {
                yield return message;
            }

            if (_request.DryRun && tableName.EndsWith(DryRunTableSuffix))
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

            if (tables.Any() && !tables.Contains(table.Name, StringComparer.OrdinalIgnoreCase))
            {
                continue;
            }

            yield return $"{(_request.DryRun ? "DRY RUN: " : "")}Purging data in {table.EnvironmentalName}";
            if (!_request.DryRun)
            {
                await PurgeData(table, token);
            }
        }
    }

    private async IAsyncEnumerable<string> ImportRecordsForTable(Container container, TableDto table,
        IEnumerable<string> files, IZipFileReader zip, [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var recordToImport in files)
        {
            if (token.IsCancellationRequested)
            {
                yield break;
            }

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

    private async Task PurgeData(TableDto table, CancellationToken token)
    {
        var container = _database.GetContainer(table.EnvironmentalName);
        await container.DeleteContainerAsync(cancellationToken: token);
    }
}