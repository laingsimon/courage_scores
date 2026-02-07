using Newtonsoft.Json.Linq;

namespace CourageScores.Models.Dtos.Query;

public class QueryRequestDto
{
    public required string Table { get; set; }
    public Dictionary<string, object?> Filters { get; set; } = [];
    public HashSet<string> Columns { get; set; } = [];
    public bool IncludeDeleted { get; set; }
    public JsonSelectSettings Settings { get; set; } = new JsonSelectSettings
    {
        ErrorWhenNoMatch = true,
    };
}
