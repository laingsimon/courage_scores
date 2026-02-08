namespace CourageScores.Models.Dtos.Query;

public class QueryRequestDto
{
    public required string Query { get; set; }
    public required string Container { get; set; }
    public int? Max { get; set; }
}
