using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace CourageScores.Models.Dtos.Data;

/// <summary>
/// Details of a table in the database
/// </summary>
[ExcludeFromCodeCoverage]
public class TableDto
{
    /// <summary>
    /// The name of the table
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// The partition key path for this table
    /// </summary>
    public string PartitionKey { get; set; } = null!;

    /// <summary>
    /// The type for this data table
    /// </summary>
    [JsonIgnore]
    public Type? DataType { get; set; }

    /// <summary>
    /// The type-name of this data table
    /// </summary>
    public string? DataTypeName => DataType?.Name;

    /// <summary>
    /// Can the logged in user import this data type
    /// </summary>
    public bool CanImport { get; set; }

    /// <summary>
    /// Can the logged in user export this data type
    /// </summary>
    public bool CanExport { get; set; }
}