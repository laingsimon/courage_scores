namespace CourageScores.Models.Dtos.Data;

/// <summary>
/// Details of a table in the database
/// </summary>
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
}