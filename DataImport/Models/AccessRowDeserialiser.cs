using System.Data;
using System.Reflection;

namespace DataImport.Models;

public class AccessRowDeserialiser
{
    public IEnumerable<T> Deserialise<T>(DataTable table, CancellationToken token)
        where T : new()
    {
        return Deserialise<T>(table.Rows.Cast<DataRow>(), token);
    }

    public IEnumerable<T> Deserialise<T>(IEnumerable<DataRow> rows, CancellationToken token)
        where T : new()
    {
        foreach (var row in rows)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            var item = new T();

            foreach (var property in typeof(T).GetProperties())
            {
                var columnName = property.GetCustomAttribute<AccessDbColumnNameAttribute>()?.Name ?? property.Name;
                if (!row.Table.Columns.Contains(columnName))
                {
                    // no column for property
                    continue;
                }

                var sourceValue = row[columnName];
                if (sourceValue == DBNull.Value)
                {
                    continue;
                }

                try
                {
                    property.SetValue(item, sourceValue);
                }
                catch (Exception exc)
                {
                    throw new InvalidOperationException($"Unable to set field {typeof(T).Name}.{property.Name} to value {sourceValue}: {exc.Message}");
                }
            }

            yield return item;
        }
    }
}