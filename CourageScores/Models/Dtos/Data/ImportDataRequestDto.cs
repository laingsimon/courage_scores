using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Data;

[ExcludeFromCodeCoverage]
public class ImportDataRequestDto
{
    /// <summary>
    /// The binary content of the zip file
    /// </summary>
    public IFormFile? Zip { get; set; }

    /// <summary>
    /// Whether the tables should be purged before restoring the data
    /// </summary>
    public bool PurgeData { get; set; } = false;

    /// <summary>
    /// The list of tables to restore, all if empty
    /// </summary>
    public List<string> Tables { get; set; } = new();

    /// <summary>
    /// The password for the zip file, if required
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Whether the data should be imported and saved or only tried out
    /// </summary>
    public bool DryRun { get; set; } = true;
}