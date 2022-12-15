namespace CourageScores.Services.Data;

public class ExportMetaData
{
    public DateTime Created { get; set; }
    public string Version { get; set; } = "v1";
    public string Creator { get; set; } = null!;
    public string Hostname { get; set; } = null!;
}