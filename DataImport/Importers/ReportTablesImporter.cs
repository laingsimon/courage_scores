using System.Data;
using CourageScores.Services;

namespace DataImport.Importers;

public class ReportTablesImporter : IImporter
{
    private readonly TextWriter _log;
    private readonly bool _reportColumns;

    public ReportTablesImporter(TextWriter log, bool reportColumns = false)
    {
        _log = log;
        _reportColumns = reportColumns;
    }

    public async Task<bool> RunImport(AccessDatabase source, CosmosDatabase destination, ImportContext importContext,
        CancellationToken token)
    {
        await foreach (var table in source.GetTables(token))
        {
            var dataTable = await source.GetTable(table, token);
            await _log.WriteLineAsync($"#### {table}, {dataTable.Rows.Count} row/s");

            if (dataTable.Rows.Count > 0 && _reportColumns)
            {
                foreach (DataColumn column in dataTable.Columns)
                {
                    await _log.WriteLineAsync($"1. `{column.ColumnName}` {column.DataType.Name}");
                }
            }
        }

        await foreach (var table in destination.GetTables(token))
        {
            var dataTable = await destination.GetTable<object>(table, token).ToList();
            await _log.WriteLineAsync($"Found destination table: {table.Name}, {dataTable.Count} row/s");
        }

        return true;
    }
}