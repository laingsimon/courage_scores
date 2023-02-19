using CourageScores.Models.Cosmos;

namespace CourageScores.Models.Dtos;

public class ErrorDetailDto : AuditedDto
{
    public SourceSystem Source { get; set; }
    public DateTime Time { get; set; }
    public string Message { get; set; } = null!;
    public string[]? Stack { get; set; }
    public string? Type { get; set; }
    public string? UserName { get; set; }
    public string? UserAgent { get; set; } = null!;
}