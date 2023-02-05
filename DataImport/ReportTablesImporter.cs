using System.Data;

namespace DataImport;

public class ReportTablesImporter : IImporter
{
    private readonly TextWriter _log;
    private readonly bool _reportColumns;

    public ReportTablesImporter(TextWriter log, bool reportColumns = false)
    {
        _log = log;
        _reportColumns = reportColumns;
    }

    public async Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token)
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
            var dataTable = await destination.GetTable(table, token);
            await _log.WriteLineAsync($"Found destination table: {table.Name}, {dataTable.Rows.Count} row/s, {dataTable.Columns.Count} column/s");
        }
    }
}