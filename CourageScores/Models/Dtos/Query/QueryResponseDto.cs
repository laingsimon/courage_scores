using Newtonsoft.Json.Linq;

namespace CourageScores.Models.Dtos.Query;

public class QueryResponseDto
{
    public required QueryRequestDto Query { get; set; }
    public required IReadOnlyCollection<JToken> Rows { get; set; }
    public int RowCount { get; set; }
}
