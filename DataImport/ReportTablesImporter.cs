namespace DataImport;

public class ReportTablesImporter : IImporter
{
    private readonly TextWriter _log;

    public ReportTablesImporter(TextWriter log)
    {
        _log = log;
    }

    public async Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token)
    {
        await foreach (var table in source.GetTables(token))
        {
            var dataTable = await source.GetTable(table, token);
            await _log.WriteLineAsync($"Found source table: {table}, {dataTable.Rows.Count} row/s");
        }

        await foreach (var table in destination.GetTables(token))
        {
            var dataTable = await destination.GetTable(table, token);
            await _log.WriteLineAsync($"Found destination table: {table.Name}, {dataTable.Rows.Count} row/s, {dataTable.Columns.Count} column/s");
        }
    }
}