namespace CourageScores.Models.Dtos.Status;

public class CacheClearedDto
{
    public List<Dictionary<string, object?>> Keys { get; set; } = new();
}