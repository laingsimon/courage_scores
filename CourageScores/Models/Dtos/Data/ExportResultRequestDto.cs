namespace CourageScores.Models.Dtos.Data;

public class ExportResultRequestDto
{
    /// <summary>
    /// A password to protect the data with
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Whether deleted records should be included
    /// </summary>
    public bool IncludeDeletedEntries { get; set; }

    /// <summary>
    /// The tables that should be exported; empty/null = all tables
    /// </summary>
    public List<string> Tables { get; set; } = new();
}