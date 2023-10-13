namespace CourageScores.Models.Dtos.Status;

public class CacheClearedDto
{
    public List<IReadOnlyDictionary<string, object?>> Keys { get; set; } = new();
}