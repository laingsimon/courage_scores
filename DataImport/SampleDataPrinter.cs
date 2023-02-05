using System.Data;

namespace DataImport;

public class SampleDataPrinter
{
    private readonly TextWriter _log;
    private readonly AccessDatabase _database;

    public SampleDataPrinter(TextWriter log, AccessDatabase database)
    {
        _log = log;
        _database = database;
    }

    public async Task PrintTable(string tableName, Func<IEnumerable<DataRow>, IEnumerable<DataRow>> orderRows, CancellationToken token)
    {
        var legHistory = await _database.GetTable(tableName, token);

        await _log.WriteLineAsync($"#### `{tableName}`");
        await _log.WriteLineAsync("| " + string.Join(" | ", legHistory.Columns.Cast<DataColumn>().Select(c => c.ColumnName)) + " |");
        await _log.WriteLineAsync("| " + string.Join(" | ", legHistory.Columns.Cast<DataColumn>().Select(_ => "----")) + " |");

        foreach (var row in orderRows(legHistory.Rows.Cast<DataRow>()))
        {
            await _log.WriteLineAsync("| " + string.Join(" | ", row.ItemArray) + " |");
        }
    }
}