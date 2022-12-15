namespace CourageScores.Models.Dtos.Data;

public class ExportDataResultDto
{
    /// <summary>
    /// A map of tables and number of rows exported
    /// </summary>
    public Dictionary<string, int> Tables { get; set; } = new();

    /// <summary>
    /// The binary content of the zip file
    /// </summary>
    public byte[]? Zip { get; set; }
}