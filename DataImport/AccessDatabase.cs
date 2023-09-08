using System.Data;
using System.Data.OleDb;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using DataImport.Models;

namespace DataImport;

[SuppressMessage("Interoperability", "CA1416:Validate platform compatibility")]
public class AccessDatabase : IDisposable
{
    private readonly OleDbConnection _connection;
    private readonly AccessRowDeserialiser _deserialiser;

    public AccessDatabase(OleDbConnection connection, AccessRowDeserialiser deserialiser)
    {
        _connection = connection;
        _deserialiser = deserialiser;
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    public async IAsyncEnumerable<string> GetTables([EnumeratorCancellation] CancellationToken token)
    {
        var schema = await _connection.GetSchemaAsync("Tables", new[]
        {
            null,
            null,
            null,
            "Table",
        }, token);
        foreach (DataRow row in schema.Rows)
        {
            yield return (string)row["TABLE_NAME"];
        }
    }

    public async Task<IReadOnlyCollection<T>> GetTable<T>(string table, CancellationToken token)
        where T : new()
    {
        var data = await GetTable(table, token);
        return _deserialiser.Deserialise<T>(data, token).ToArray();
    }

    public async Task<DataTable> GetTable(string table, CancellationToken token)
    {
        return await Task.Run(() =>
        {
            var dataSet = new DataSet();
            var command = _connection.CreateCommand();
            command.CommandText = $"SELECT * FROM [{table}]";
            try
            {
                var adapter = new OleDbDataAdapter(command);
                adapter.Fill(dataSet);

                return dataSet.Tables[0];
            }
            catch (OleDbException exc)
            {
                throw new InvalidOperationException($"Unable to execute command: '{command.CommandText}'", exc);
            }
        }, token);
    }
}