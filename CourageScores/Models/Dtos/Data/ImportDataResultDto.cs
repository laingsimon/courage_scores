using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Data;

[ExcludeFromCodeCoverage]
public class ImportDataResultDto
{
    /// <summary>
    /// A map of tables and number of rows imported
    /// </summary>
    public Dictionary<string, int> Tables { get; set; } = new();
}