namespace CourageScores.Models.Dtos.Data;

public class ImportDataResultDto
{
    /// <summary>
    /// A map of tables and number of rows imported
    /// </summary>
    public Dictionary<string, int> Tables { get; set; } = new();
}