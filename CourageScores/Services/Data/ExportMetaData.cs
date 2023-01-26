using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Data;

[ExcludeFromCodeCoverage]
public class ExportMetaData
{
    public const string FileName = "meta.json";

    public DateTime Created { get; set; }
    public string Version { get; set; } = "v1";
    public string Creator { get; set; } = null!;
    public string Hostname { get; set; } = null!;
}