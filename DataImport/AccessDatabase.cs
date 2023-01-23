using System.Data;
using System.Data.OleDb;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;

namespace DataImport;

[SuppressMessage("Interoperability", "CA1416:Validate platform compatibility")]
public class AccessDatabase : IDisposable
{
    private readonly OleDbConnection _connection;

    public AccessDatabase(OleDbConnection connection)
    {
        _connection = connection;
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    public async IAsyncEnumerable<string> GetTables([EnumeratorCancellation] CancellationToken token)
    {
        var schema = await _connection.GetSchemaAsync("Tables", new[] { null, null, null, "Table" }, token);
        foreach (DataRow row in schema.Rows)
        {
            yield return (string)row["TABLE_NAME"];
        }
    }

    public async Task<DataTable> GetTable(string table, CancellationToken token)
    {
        return await Task.Run(() =>
        {
            var dataSet = new DataSet();
            var command = _connection.CreateCommand();
            command.CommandText = $"SELECT * FROM {table}";
            var adapter = new OleDbDataAdapter(command);
            adapter.Fill(dataSet);

            return dataSet.Tables[0];
        }, token);
    }
}