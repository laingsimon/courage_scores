namespace CourageScores.Models.Dtos.Data;

public class SingleDataResultDto : AuditedDto
{
    public string? Name { get; set; }
    public DateTime? Date { get; set; }
    public Guid? DivisionId { get; set; }
    public Guid? SeasonId { get; set; }
}